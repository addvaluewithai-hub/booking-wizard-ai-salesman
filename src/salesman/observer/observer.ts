import { createVisitorEvent, type VisitorEvent, type VisitorEventInput } from './event-types';

type ObserverOptions = {
  onEvent: (event: VisitorEvent) => void;
  getPage?: () => string;
};

type ObservedElementKind = 'section' | 'entity' | 'cta' | 'price' | 'spec';

const SEEN_KEY = 'ai-salesman:seen-entities';

function loadSeenEntities(): Set<string> {
  if (typeof sessionStorage === 'undefined') return new Set();
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveSeenEntities(seen: Set<string>) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-150)));
  } catch {
    // Storage can be disabled; observation should continue in-memory.
  }
}

function getObservedKind(element: HTMLElement): ObservedElementKind | null {
  if (element.dataset.salesSection) return 'section';
  if (element.dataset.salesEntity) return 'entity';
  if (element.dataset.salesCta) return 'cta';
  if (element.dataset.salesPrice !== undefined) return 'price';
  if (element.dataset.salesSpec !== undefined) return 'spec';
  return null;
}

export function classifyEntityVisibility({
  entityId,
  visibilityKey,
  seenEntities,
  emittedVisibilityKeys,
}: {
  entityId: string;
  visibilityKey: string;
  seenEntities: Set<string>;
  emittedVisibilityKeys: Set<string>;
}): 'product_view' | 'product_revisit' | null {
  if (!entityId || emittedVisibilityKeys.has(visibilityKey)) return null;
  const type = seenEntities.has(entityId) ? 'product_revisit' : 'product_view';
  emittedVisibilityKeys.add(visibilityKey);
  seenEntities.add(entityId);
  return type;
}

export function createSalesObserver({ onEvent, getPage = () => window.location.pathname }: ObserverOptions) {
  const seenEntities = loadSeenEntities();
  const emittedVisibilityKeys = new Set<string>();
  let intersectionObserver: IntersectionObserver | null = null;
  let active = false;

  const emit = (input: Omit<VisitorEventInput, 'page'> & { page?: string }) => {
    const event = createVisitorEvent({ ...input, page: input.page ?? getPage() });
    onEvent(event);
    return event;
  };

  const observeVisibility = () => {
    if (typeof IntersectionObserver === 'undefined') return;

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.45) continue;
          const element = entry.target as HTMLElement;
          const kind = getObservedKind(element);
          if (!kind) continue;

          const identity =
            element.dataset.salesSection ??
            element.dataset.salesEntity ??
            element.dataset.salesCta ??
            element.id ??
            element.textContent?.trim().slice(0, 80) ??
            'anonymous';
          const visibilityKey = `${kind}:${identity}:${getPage()}`;

          if (kind === 'entity') {
            const entityId = element.dataset.salesEntity;
            if (!entityId) continue;
            const type = classifyEntityVisibility({ entityId, visibilityKey, seenEntities, emittedVisibilityKeys });
            if (!type) continue;
            emit({ type, entityId });
            saveSeenEntities(seenEntities);
            continue;
          }

          if (emittedVisibilityKeys.has(visibilityKey)) continue;
          if (kind === 'section') {
            emit({ type: 'section_view', entityId: element.dataset.salesSection });
          } else if (kind === 'cta') {
            emit({ type: 'cta_view', entityId: element.dataset.salesCta });
          } else if (kind === 'price') {
            emit({ type: 'price_view', entityId: element.dataset.salesEntity });
          } else if (kind === 'spec') {
            emit({ type: 'spec_view', entityId: element.dataset.salesEntity });
          }

          emittedVisibilityKeys.add(visibilityKey);
        }
      },
      { threshold: [0.45, 0.7] },
    );

    document.querySelectorAll<HTMLElement>('[data-sales-section], [data-sales-entity], [data-sales-cta], [data-sales-price], [data-sales-spec]').forEach((element) => {
      intersectionObserver?.observe(element);
    });
  };

  const clickHandler = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-sales-cta], [data-compare-action], [data-sales-help]') : null;
    if (!target) return;

    if (target.dataset.salesCta) {
      emit({ type: 'cta_click', entityId: target.dataset.salesCta });
    }

    if (target.dataset.compareAction) {
      const [action, entityId = ''] = target.dataset.compareAction.split(':');
      if (entityId && (action === 'add' || action === 'remove')) {
        emit({ type: action === 'add' ? 'compare_add' : 'compare_remove', entityId });
      }
    }

    if (target.dataset.salesHelp !== undefined) emit({ type: 'explicit_help' });
  };

  const inputHandler = (event: Event) => {
    const target = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement ? event.target : null;
    if (!target) return;

    const form = target.closest<HTMLFormElement>('form[data-sales-form], form[data-sales-booking]');
    if (!form || form.dataset.salesStarted === 'true') return;
    form.dataset.salesStarted = 'true';
    emit({ type: form.dataset.salesBooking !== undefined ? 'booking_start' : 'form_start', entityId: form.dataset.salesForm || form.dataset.salesBooking });
  };

  const changeHandler = (event: Event) => {
    const target = event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement ? event.target : null;
    if (!target?.dataset.salesFilter) return;
    emit({
      type: 'filter_change',
      entityId: target.dataset.salesFilter,
      metadata: { value: target.value },
    });
  };

  const pageHideHandler = () => {
    document.querySelectorAll<HTMLFormElement>('form[data-sales-form][data-sales-started="true"], form[data-sales-booking][data-sales-started="true"]').forEach((form) => {
      if (form.dataset.salesCompleted === 'true') return;
      emit({
        type: form.dataset.salesBooking !== undefined ? 'booking_abandon' : 'form_abandon',
        entityId: form.dataset.salesForm || form.dataset.salesBooking,
      });
    });
  };

  return {
    start() {
      if (active || typeof window === 'undefined') return;
      active = true;
      emit({ type: 'page_view' });
      observeVisibility();
      document.addEventListener('click', clickHandler, { passive: true });
      document.addEventListener('input', inputHandler, { passive: true });
      document.addEventListener('change', changeHandler, { passive: true });
      window.addEventListener('pagehide', pageHideHandler);
    },
    stop() {
      if (!active || typeof window === 'undefined') return;
      active = false;
      intersectionObserver?.disconnect();
      intersectionObserver = null;
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('input', inputHandler);
      document.removeEventListener('change', changeHandler);
      window.removeEventListener('pagehide', pageHideHandler);
    },
    emit,
    routeChanged(path: string) {
      emittedVisibilityKeys.clear();
      emit({ type: 'page_view', page: path });
      intersectionObserver?.disconnect();
      observeVisibility();
    },
    markFormComplete(form: HTMLFormElement) {
      form.dataset.salesCompleted = 'true';
    },
  };
}

export type SalesObserver = ReturnType<typeof createSalesObserver>;
