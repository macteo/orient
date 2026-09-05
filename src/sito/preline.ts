// Bundles Preline's runtime instead of loading it from a CDN `<script>` tag.
import 'preline';

function autoInit(): void {
  window.HSStaticMethods?.autoInit();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}
