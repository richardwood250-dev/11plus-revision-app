import ResizeObserver from 'resize-observer-polyfill';
import 'core-js/features/array/flat';
import 'core-js/features/array/flat-map';
import 'core-js/features/object/from-entries';

// Polyfill ResizeObserver globally if missing
if (!window.ResizeObserver) {
    window.ResizeObserver = ResizeObserver;
}
