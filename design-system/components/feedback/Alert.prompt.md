<!-- Imported from the Claude Design design system "Braisor - Preline" (095ff135-97b7-4430-ba48-8c6b4874b775) on 2026-09-05. Do not hand-edit; re-import instead. -->
# Alert

A contextual feedback banner. Use for inline success/error/warning/info messages.

```jsx
<Alert variant="soft" color="green" title="Payment received"
  icon={<Icon name="CircleCheck" size={18} />}>
  Your invoice has been paid.
</Alert>
<Alert variant="bordered" color="red" dismissible title="Something went wrong" />
```

- **variant**: `soft` (default), `solid`, `bordered` (white with colored left accent)
- **color**: blue, green, red, yellow, gray
- `dismissible` adds a × button (wire `onDismiss`). Radius 12px.
