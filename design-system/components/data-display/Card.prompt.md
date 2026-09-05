<!-- Imported from the Claude Design design system "Braisor - Preline" (095ff135-97b7-4430-ba48-8c6b4874b775) on 2026-09-05. Do not hand-edit; re-import instead. -->
# Card

The primary content container. Radius 12px, gray-200 border, soft shadow. Compose with `Card.Header/Body/Footer` or the `title` / `footer` props.

```jsx
<Card title="Team plan" subtitle="Billed annually">
  Everything your team needs to scale.
</Card>

<Card>
  <Card.Header>Header</Card.Header>
  <Card.Body>Body content</Card.Body>
  <Card.Footer><Button size="sm">Save</Button></Card.Footer>
</Card>
```

- **variant**: `default` (border + soft shadow), `flat` (border only), `elevated` (big shadow, no border)
- `hover` lifts the shadow on hover.
