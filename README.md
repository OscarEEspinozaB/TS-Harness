# TS-Harness

**¿Se puede hacer que una función de TypeScript dependa solo de lo que dice su firma?** Este proyecto busca que, para entender una función, baste con leer su firma y su cuerpo, y lo comprueba con un programa.

**El arnés es para la IA, no para el lenguaje.** Con cientos de miles de líneas, un modelo nunca lee el proyecto entero. Todo lo que una función hace sin que su firma lo diga queda fuera de su vista: estado compartido, efectos externos, excepciones, herencia. El arnés rechaza esas formas para que lo que el modelo no lee no pueda sorprenderlo. Que esto ayude de verdad a una IA es una hipótesis que todavía hay que medir.

Es el tercer arnés de la serie, después de [C-Harness](https://github.com/OscarEEspinozaB/C-Harness) y [Rust-Harness](https://github.com/OscarEEspinozaB/Rust-Harness). Sus reglas vienen de las [premisas de Zymbol](https://github.com/zymbol-lang/zymbol-design), pero **es fiel a TypeScript**: de cada premisa toma el propósito y lo hace cumplir con los mecanismos del propio lenguaje, sin imponer formas pensadas para otro.

## Estado actual

**Las reglas ya son programas.** `audit.ts` audita un proyecto TypeScript con 16 reglas, entre ellas estado exportado, acceso al exterior fuera de los puntos de entrada, parámetros mutables sin escribir, `throw`, clases, capas e importaciones, nombres ocultos y aserciones de tipo. Las excepciones se documentan una a una, con su motivo. Qué comprueba cada regla, y qué no, está en [docs/DISENO.md](docs/DISENO.md), sección 11.

La medición del 9 de noviembre de 2026: 69 celdas con 0 veredictos erróneos, 3 proyectos de prueba de varios archivos, y el arnés pasa su propia auditoría sin hallazgos. Ver [results/](results/).

## Usarlo en un proyecto

Pon un `harness.json` en la raíz del proyecto (formato en [docs/DISENO.md](docs/DISENO.md), sección 11) y ejecuta:

```sh
node ../TS-Harness/audit.ts .   # 0 sin hallazgos, 1 con hallazgos, 2 no pudo auditar
```

Para validar antes de cada commit, llámalo desde un gancho `pre-commit`.

Una excepción se escribe sobre la línea que afecta, con la regla y el motivo:

```ts
// harness-allow LAMBDA: the generator's state lives in its closure; returning it would copy it per draw
```

## Reproducir la medición

Necesitas Node 24 o posterior, que ejecuta TypeScript sin compilar:

```sh
npm install       # también activa el gancho pre-commit de este repositorio
npm run check     # tsc, las celdas, los proyectos de prueba y la autoauditoría
node run.ts       # solo las celdas y los proyectos de prueba, con la tabla completa
node audit.ts .   # solo la autoauditoría
```

Su primer usuario será un simulador, privado por ahora, cuya alfa se escribirá entera bajo este arnés.

## Idiomas

El código está en inglés: identificadores, comentarios, mensajes y nombres de archivo. La documentación está en español. Los nombres de código citados en los documentos se escriben tal como aparecen en el código.

## Licencia

Aún no se ha elegido. Hasta entonces, el proyecto no concede ninguna licencia sobre su código.
