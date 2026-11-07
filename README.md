# TS-Harness

**¿Se puede hacer que una función de TypeScript dependa solo de lo que dice su firma?** Este proyecto busca que, para entender una función, baste con leer su firma y su cuerpo, y lo comprobará con un programa.

**El arnés es para la IA, no para el lenguaje.** Con cientos de miles de líneas, un modelo nunca lee el proyecto entero. Todo lo que una función hace sin que su firma lo diga queda fuera de su vista: estado compartido, efectos externos, excepciones, herencia. El arnés rechaza esas formas para que lo que el modelo no lee no pueda sorprenderlo. Que esto ayude de verdad a una IA es una hipótesis que todavía hay que medir.

Es el tercer arnés de la serie, después de [C-Harness](https://github.com/OscarEEspinozaB/C-Harness) y [Rust-Harness](https://github.com/OscarEEspinozaB/Rust-Harness). Sus reglas vienen de las [premisas de Zymbol](https://github.com/zymbol-lang/zymbol-design), pero **es fiel a TypeScript**: de cada premisa toma el propósito y lo hace cumplir con los mecanismos del propio lenguaje, sin imponer formas pensadas para otro.

## Estado actual

**Todavía no existe ninguna regla propia.** Una regla no existe hasta que un programa rechaza el código que la incumple. Existen el diseño, en [docs/DISENO.md](docs/DISENO.md), y un ejecutor que mide las celdas. La primera medición, solo con `tsc` en modo estricto, detuvo 14 de 52 celdas, con todos los veredictos correctos: ver [results/](results/).

## Reproducir la medición

Necesitas Node 24 o posterior, que ejecuta TypeScript sin compilar:

```sh
npm install
node run.ts       # mide las celdas; termina con error si algún veredicto es incorrecto
npx tsc -p .      # comprueba con tsc el propio ejecutor
```

Su primer usuario será un simulador, privado por ahora, cuya alfa se escribirá entera bajo este arnés.

## Idiomas

El código está en inglés: identificadores, comentarios, mensajes y nombres de archivo. La documentación está en español. Los nombres de código citados en los documentos se escriben tal como aparecen en el código.

## Licencia

Aún no se ha elegido. Hasta entonces, el proyecto no concede ninguna licencia sobre su código.
