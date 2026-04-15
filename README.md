# jizy-niceselect

A lightweight, customizable and accessible select box replacement library.

## Install

```bash
npm install jizy-niceselect
```

## Usage

```js
import { NiceSelect } from 'jizy-niceselect';

const select = document.querySelector('select');
const niceSelect = new NiceSelect(select, {
    searchable: true,
    placeholder: 'Choose',
});
```

Or build from data:

```js
const niceSelect = NiceSelect.fromData(
    [{ value: '1', text: 'One' }, { value: '2', text: 'Two' }],
    false,
    { placeholder: 'Choose' }
);
```

## Markup

The library wraps a native `<select>`:

```html
<select data-searchable data-placeholder="Choose ...">
    <option value="">Choose ...</option>
    <option value="1">One</option>
    <option value="2" selected>Two</option>
</select>
```

Supported attributes on the select: `multiple`, `disabled`, `data-searchable`, `data-placeholder`, `data-current`, `tabindex`.

## Configuration

| Option | Default | Description |
|---|---|---|
| `disabled` | `false` | Disable the control |
| `multiple` | `false` | Multi-select mode |
| `searchable` | `false` | Show searchbox |
| `showSelection` | `false` | Show current selection block |
| `placeholder` | `'Choose'` | Placeholder text |
| `searchPlaceholder` | `'Search'` | Searchbox placeholder |
| `dropdown.className` | `'dropdown'` | Dropdown class |
| `dropdown.selectedClassName` | `'selected'` | Selected option class |
| `dropdown.disabledClassName` | `'disabled'` | Disabled option class |
| `search.className` | `'searchbox'` | Searchbox class |
| `search.minChars` | `3` | Minimum chars before filtering |
| `selection.className` | `'current'` | Current selection class |
| `selection.noSelectionMessage` | `'Choose below ...'` | Empty-selection label |
| `selection.selectionCountMessage` | `'{count} items selected'` | Count label (multi) |
| `selection.showCount` | `false` | Show count instead of items |
| `selection.minShowCount` | `3` | Threshold for count display |

## API

- `open()` / `close()` — toggle the dropdown
- `enable()` / `disable()` — toggle disabled state
- `reset()` — clear selection and search
- `destroy()` — remove the NiceSelect and restore the original `<select>`

## Styles

Import the bundled CSS from `dist/css/` or the LESS sources from `lib/less/`.

## License

MIT © Joffrey Demetz
