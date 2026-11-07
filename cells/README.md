# Celdas

Una celda es un programa muy pequeño que el arnés debe aceptar o rechazar. Cada archivo `cells/*.ts` empieza con dos líneas de cabecera: la primera declara la regla y el tipo, y la segunda, el motivo esperado si debe detenerse.

```ts
// rule: STATE kind: violation
// reason: exported mutable binding
```

| `kind` | Veredicto correcto |
| --- | --- |
| `control` | Programa válido: debe pasar |
| `violation` | Se detiene y el mensaje contiene `reason`. Si se detiene por otra razón, el veredicto es `**REASON**` |
| `gap` | Debería detenerse, pero aún no hay regla: hoy pasa. Si llega a detenerse, el veredicto es `**REVIEW**`, y hay que convertirla en `violation` |

El nombre del archivo empieza por la regla en minúsculas: `state_exported_let.ts`, `world_date_now_outside_main.ts`.

Cada celda es un solo archivo, y todas se comprueban con las opciones de [tsconfig.json](tsconfig.json). Hoy esa es la única etapa: un `gap` que pasa es lo esperado, porque marca lo que deben añadir las reglas propias. `rule: TSC` señala lo que depende solo de la configuración de `tsc`.
