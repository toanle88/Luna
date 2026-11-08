# Third-party notices

Luna's own code is distributed under the [MIT license](LICENSE). Upstream code, generated
components, fonts, and installed dependencies retain their respective licenses.

| Material                            | Location and notice                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn-generated UI and hooks       | `components/ui/`, `hooks/use-mobile.ts`; retained shadcn MIT notice in [the vendor license](vendor/shadcn-tailwind-4.13.0.LICENSE.md) |
| Vendored shadcn Tailwind stylesheet | [CSS](vendor/shadcn-tailwind-4.13.0.css) and [MIT notice](vendor/shadcn-tailwind-4.13.0.LICENSE.md)                                   |
| Sites Vite integration              | [Source](scripts/vite/sites-vite-plugin.ts) and [MIT notice](scripts/vite/sites-vite-plugin.LICENSE)                                  |
| Installed packages                  | Exact resolutions in `pnpm-lock.yaml`; license files remain in the installed package distributions                                    |
| Web fonts                           | Requested through Google Fonts by `app/globals.css`; font binaries are not vendored in this repository                                |

Preserve upstream notices when modifying or redistributing the corresponding material. The original
starter documentation is retained in [docs/STARTER-README.md](docs/STARTER-README.md).
