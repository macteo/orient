<!-- Imported from the Claude Design design system "Braisor - Preline" (095ff135-97b7-4430-ba48-8c6b4874b775) on 2026-09-05. Do not hand-edit; re-import instead. -->
# Button

The primary action element. Use for form submits, dialog actions, and calls-to-action.

```jsx
<Button variant="solid" color="blue" size="md">Save changes</Button>
<Button variant="outline" color="dark">Cancel</Button>
<Button variant="soft" color="green" startIcon={<Icon name="Check" size={16} />}>Approved</Button>
<Button variant="ghost" color="gray">More</Button>
<Button variant="link" color="blue" href="#">Learn more</Button>
```

- **variant**: `solid` (default), `outline`, `soft`, `ghost`, `link`
- **color**: `blue` (default/brand), `dark`, `gray`, `green`, `red`, `yellow`, `white` (white only for solid)
- **size**: `sm` (36px), `md` (44px), `lg` (60px)
- Radius is 8px (`--radius-button`). Focus shows the brand ring. Pass `href` to render an `<a>`.
