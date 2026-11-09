# Diseño de TS-Harness

7 de noviembre de 2026; reglas implementadas el 9 de noviembre de 2026. Las secciones 1 a 10 son el diseño con el que se empezó: allí las reglas aparecen como **propuestas**. La sección 11 dice cuáles existen ya como programa (`audit.ts`), qué comprueba cada una, qué no comprueba y qué decisiones se tomaron al implementarlas. Lo marcado como **decidido** lo confirmó el autor o lo delegó con un criterio explícito.

## 1. Para qué

**Fuente:** `zymbol-design/MODEL.md` § 2.4, que conserva literal la frase del autor del 21 de septiembre de 2026 que dice para qué sirve el diseño de Zymbol:

> «En conjunto, las cinco apuntan a una misma idea: reducir el contexto implícito y el espacio de errores que puede manejar el programador —y, especialmente, una IA— al modificar código.»

`interpreter/AGENTIC.md` lo dice desde el lado de la IA: un modelo no olvida una regla, nunca la tuvo, y llena el hueco con la forma más probable de otro lenguaje. Por eso importan las propiedades que hacen **imposible escribir en silencio código incorrecto**, y que la cantidad de contexto necesaria para revisar una línea sea esa línea.

**Original** (el autor, 7 de noviembre de 2026), al aplicarlo a este arnés: «usemos la mejor opción para contener el contexto para que tú como modelo de AI puedas escribir código más seguro sobre todo cuando las líneas de códigos sean cientos de miles. Esa es la idea del porque del arnés no es para el lenguaje es más para la AI».

El arnés no existe para mejorar TypeScript. Existe para que **un modelo de IA pueda escribir y cambiar código correcto en un proyecto que no le cabe en el contexto**. Con cientos de miles de líneas, el modelo nunca lee el proyecto entero: lee una función, sus firmas vecinas y poco más. Cada cosa que una función hace sin que su firma lo diga es algo que el modelo no verá y romperá: estado compartido, efectos externos, excepciones, herencia, exportaciones implícitas.

**El criterio de desempate decidido:** entre dos formas de escribir lo mismo, el arnés exige la que deja menos que leer fuera de la firma y el cuerpo.

Que esto ayude de verdad a una IA es una **hipótesis sin medir**, como en Rust-Harness. Se mide (sección 9) con las mismas tareas hechas por un modelo sobre el mismo proyecto, con y sin el arnés.

## 2. La propiedad

> **Una función solo cambia lo que su firma dice que cambia, solo alcanza el exterior a través de lo que recibe, y solo falla de las formas que su tipo de retorno declara.**

Si la propiedad se cumple, para cambiar una función basta leer su cuerpo y las firmas de lo que llama. La segunda mitad tiene además un efecto que necesita una simulación: si nada lee el reloj ni el azar sin recibirlos, la misma entrada da el mismo resultado por construcción.

## 3. Principios

**Decididos:**

- **Fidelidad a TypeScript.** Cada regla cita la premisa de Zymbol de la que sale su propósito, y se cumple con los mecanismos del lenguaje: tipos, `readonly`, el sistema de módulos y el compilador. Si TypeScript no tiene una forma fiel de sostener una premisa, se declara como límite; no se inventa una construcción ajena.
- **El arnés es para la IA** (sección 1). Algunas reglas no salen de una premisa de Zymbol sino de ese propósito; lo dicen en su columna de premisa.
- **Repositorio propio**, fuera de los proyectos que lo usan, con sus propias versiones.
- **Un solo perfil.** No hay modo relajado que un modelo pueda elegir. La única excepción es el punto de entrada (sección 8).

**Heredados de C-Harness y Rust-Harness:**

- **Una regla es un programa.** Antes de tener uno es, como mucho, una celda de tipo `gap`.
- **Cada regla dice qué comprueba y qué no.** No se afirman garantías más amplias que lo medido.
- **Primero se pasa por sí mismo.** Todo el código del arnés supera sus propias reglas.
- **Cada defecto se corrige junto con una celda que lo vigile.**
- **Un rechazo solo vale si es por el motivo esperado.**
- **Las celdas son pruebas de regresión, no una tasa de detección.** Lo revelador es probar con programas reales.
- **Lo que TypeScript ya garantiza no necesita regla.** El arnés cubre lo que el lenguaje deja abierto.

## 4. Mecanismo previsto

- **TypeScript 6.0.3, con versión fijada.** TypeScript 7 (la `latest` el 7 de noviembre de 2026, 7.0.2) es el compilador nativo, y toda su API para programas se publica como `unstable/*`. La 6.0.3 conserva la API clásica y estable, con el verificador de tipos que necesitan las reglas. Pasar a la 7 es una decisión aparte, cuando su API sea estable; su `tsc` más rápido importará en proyectos grandes.
- **El verificador se apoya en la API del compilador de TypeScript** (paquete `typescript`), su única dependencia en ejecución. `@types/node` es dependencia de desarrollo: solo da tipos al punto de entrada. A diferencia de Rust-Harness, que lee la sintaxis sin tipos, aquí el verificador tiene los tipos, así que puede detectar lo que Rust-Harness dejó como hueco, por ejemplo una mutación hecha a través de un método.
- **`tsc` en modo estricto es la primera etapa.** Se proponen, además de `strict`:
  - `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`;
  - `erasableSyntaxOnly`: el código solo usa sintaxis que Node sabe eliminar;
  - `verbatimModuleSyntax`: una importación que solo trae tipos se escribe `import type`, de modo que se ve qué dependencias existen en ejecución;
  - `isolatedDeclarations`: todo lo exportado declara sus tipos explícitamente. Una firma exportada se entiende sin leer el cuerpo, y es la base del mapa de superficie.
- **Se ejecuta con Node sin paso de compilación**, porque Node 24 elimina los tipos al cargar. Medido el 7 de noviembre de 2026: Node v24.16.0 instalado.
- **Códigos de salida:** 0 si no hay hallazgos, 1 si los hay y 2 si no pudo auditar. Una auditoría que no leyó nada nunca termina con 0. El 2 es un UNKNOWN: no es un aprobado.
- **El ejecutor de las celdas está en TypeScript**, bajo las mismas reglas, en lugar del `run.sh` de Rust-Harness.
- **Mapa de superficie** (propuesto). Una orden del arnés reúne las declaraciones (`.d.ts`) de todos los módulos en un índice: qué exporta cada módulo, con qué firma y de qué depende. Con `isolatedDeclarations`, `tsc` las genera sin analizar los cuerpos. El modelo carga el mapa, no el código, y abre solo el cuerpo que va a cambiar.

## 5. Reglas propuestas

| Regla | Premisa | Propósito | Cómo se cumpliría en TypeScript | Límite previsto |
| --- | --- | --- | --- | --- |
| `STATE` | MEM-1, MEM-2, MEM-4 | El estado de un módulo no sale de él | Quien importa ya no puede reasignar un binding importado: eso lo da el lenguaje. Se rechaza exportar un `let` y exportar un valor de tipo mutable | Estado global dentro de una dependencia |
| `WORLD` | AGT-4, MEM-5 | El exterior entra por un solo lugar y se ve en las firmas | Fuera de `main` se rechazan los globales del entorno: `Date`, `performance`, `Math.random`, `crypto`, `process`, `console`, `fetch`, `globalThis`, `window`, `document`, `setTimeout`, y los módulos `node:` que tocan el exterior. `main` los envuelve en capacidades con tipo (un `Clock`, un `Random`, un `Socket`) y las pasa por parámetro: una función que puede leer la hora lo dice en su firma | Dependencias que tocan el exterior por dentro: la lista no se puede declarar cerrada, igual que en Rust-Harness |
| `CONTEXT` | MEM-5 | La firma dice qué cambia | Un parámetro de tipo mutable que la función no modifica se rechaza: debió ser `readonly`. Así, un tipo mutable en la firma solo puede significar que la función lo modifica. Para saberlo, el verificador vuelve a comprobar la función con ese parámetro como `Readonly` y mira si sigue compilando. Escribir sobre un `readonly` ya lo rechaza `tsc`. Mutar valores locales es libre: no sale de la función | La llamada no lleva marca, porque TypeScript no la tiene, y no se inventa una. `Readonly<T>` es superficial: un objeto anidado puede seguir siendo mutable |
| `ERROR` | Sección 1 | La firma dice cómo falla | Se rechaza `throw` y `Promise.reject` fuera de `main`. Un fallo es un valor del tipo de retorno, una unión discriminada, como `{ ok: true, value } \| { ok: false, error }`. `try`/`catch` se permite en cualquier parte, para convertir en valor la excepción de una biblioteca | Las operaciones del lenguaje y de las bibliotecas que lanzan por dentro (`JSON.parse`, un `RangeError`) no se ven en la firma |
| `CLASS` | MEM-3, sección 1 | Entender un método no exige leer una jerarquía | Se rechazan las declaraciones `class` en el código propio. Los datos son tipos `readonly` y el comportamiento son funciones de módulo. Usar las clases del lenguaje (`Map`, `Float64Array`, `Error` como valor) se permite | |
| `SURFACE` | AGT-2 | Un módulo declara su superficie | Se rechazan `export *` y `export default`: lo que sale de un módulo tiene nombre y está escrito en él, y un nombre es el mismo en cada archivo que lo importa. Los tipos explícitos de lo exportado los exige `isolatedDeclarations` | |
| `LAYER` | AGT-3, sección 1 | Las dependencias se conocen y van en una sola dirección | Se rechazan los ciclos de importación. Un proyecto puede declarar capas en la configuración, por ejemplo que el motor no importe la vista ni el servidor, y se rechaza la importación que las cruza hacia arriba | |
| `NAME` | MEM-7 | Un nombre, una cosa | Se rechaza ocultar un nombre (shadowing), un parámetro con el nombre de su función y una variable con el mismo nombre que una función en el mismo ámbito. Las sobrecargas de una función son una sola cosa y se permiten | |
| `LAMBDA` | MEM-6 | Una lambda solo escribe lo que declara | Se rechaza que una arrow function o una expresión de función asigne a una variable capturada. Lo idiomático es devolver el valor o usar `reduce` | Mutación de un objeto capturado mediante un método, hasta que se mida si los tipos bastan para detectarla |
| `IMPORT` | AGT-1, AGT-3 | Importar no ejecuta nada, y lo que puede ejecutarse se sabe antes | En el nivel superior de un módulo solo hay importaciones, exportaciones, declaraciones y `const` inicializadas con literales o funciones. Se rechazan las llamadas en el nivel superior fuera del punto de entrada, `import()` con ruta no literal, `require`, `eval` y `new Function` | |
| `RELEASE` | MEM-8 | La vida de un recurso se ve en el código | Un valor de tipo `Disposable` o `AsyncDisposable` (un socket, un archivo) se declara con `using` o `await using`, y se libera al salir de su bloque. TypeScript ya trae ese mecanismo | Recursos de bibliotecas que no implementan `Disposable` |
| `SIZE` | MEM-5, sección 1 | Una función cabe en lo que el modelo lee de una vez | Más de 7 parámetros se rechaza, como en Rust-Harness. Los límites de líneas por función y por archivo se fijan después de medir proyectos reales, no antes | |
| `HIDDEN` | — | Nada oculta lo que el código hace | Se rechazan las salidas de emergencia de los tipos: `any` explícito, las aserciones `as` y la aserción no nula `!`. `as const` no es una salida de emergencia, sino una forma de declarar inmutabilidad, y se permite | Los tipos de una dependencia pueden contener `any` |
| `BYPASS` | — | Las reglas no se apagan desde el código | Se rechazan `@ts-ignore`, `@ts-expect-error` y `@ts-nocheck`, y cualquier comentario que relaje una regla del arnés | Banderas de `tsc` relajadas desde fuera del código |

## 6. Lo que queda fuera, y por qué

- **COL-2, COL-7 y las premisas SYM** tratan de la sintaxis de Zymbol. No tienen sentido en TypeScript.
- **La liberación automática de MEM-8** la resuelve el recolector de basura. Su mitad explícita es `RELEASE`.
- **COL-6, sin alias**, se sostiene con `CONTEXT` y `STATE`: si lo compartido es `readonly`, el alias deja de ser observable.
- **Las reglas propias de un dominio** no pertenecen a este arnés. Por ejemplo, que un simulador no use funciones trigonométricas en su paso de integración, porque no son deterministas entre motores JS, lo decide el proyecto que lo necesita.

## 7. Celdas

Formato heredado de Rust-Harness, en [cells/README.md](../cells/README.md).

## 8. Decisiones tomadas

El 7 de noviembre de 2026, el autor delegó estas cuatro decisiones con un criterio: la opción que mejor contenga el contexto para una IA (sección 1).

1. **Clases: prohibidas en el código propio** (`CLASS`). Un método puede cambiar `this` sin que su firma lo diga, y la herencia obliga a leer otros archivos para saber qué hace una llamada. Con tipos `readonly` y funciones, la firma lo dice todo. Se descartó permitirlas con campos `readonly`, porque la herencia y `this` seguirían ocultando contexto.
2. **`using` obligatorio para los recursos** (`RELEASE`). La vida de un socket queda escrita en el bloque que lo usa.
3. **Punto de entrada:** uno o varios archivos declarados en la configuración del arnés, cada uno con una función `main` que solo se invoca en ese archivo. Es la única excepción a `WORLD`, `ERROR` e `IMPORT`, como `fn main` en Rust-Harness. `main` convierte el exterior en capacidades con tipo y las pasa hacia abajo.
4. **Un solo perfil.** Un modo relajado sería una salida que un modelo podría tomar.

Añadidas por el mismo criterio: `ERROR`, `SURFACE`, `LAYER`, `SIZE` y el mapa de superficie. Todo esto se puede revisar: si una medición muestra que una regla cuesta más contexto del que ahorra, se cambia, de forma deliberada y por separado.

## 9. Qué falta medir

1. ~~**Cuánto cubre ya `tsc`**~~ en modo estricto con sus banderas. Medido el 7 de noviembre de 2026; ver sección 10.
2. **Cuánto cuesta cada regla en código real.** Por ejemplo, cuántos `throw`, `class` y `export default` tiene un proyecto TypeScript conocido, y qué haría falta para migrarlo.
3. **La hipótesis de la sección 1.** Un mismo conjunto de tareas hechas por un modelo sobre un proyecto grande, con el arnés y sin él, contando defectos introducidos y cuánto código tuvo que leer. Sin esta medición, el arnés sigue siendo una hipótesis.

## 10. Primera medición: solo `tsc`

7 de noviembre de 2026, TypeScript 6.0.3 y Node v24.16.0. Tabla completa en [results/measurement-2026-11-07-tsc-only.md](../results/measurement-2026-11-07-tsc-only.md). Son 52 celdas de un solo archivo: `tsc` detiene 14 y todos los veredictos son correctos. Son pruebas de regresión escritas junto con la configuración, **no una tasa de detección**.

**Lo que `tsc` ya cubre con la configuración de `cells/tsconfig.json`, sin código propio:**

| Regla | Lo que se detiene | Mecanismo |
| --- | --- | --- |
| `WORLD`, en parte | `console`, `setTimeout`, `fetch`, `process`, `require`, módulos `node:` | `lib` limitado a ECMAScript (`es2024`, `esnext.disposable`) y `types: []`: el código no ve el navegador ni Node |
| `CONTEXT`, en parte | Escribir a través de un parámetro `readonly` | `readonly` en la firma |
| `SURFACE`, en parte | Lo exportado sin tipo explícito | `isolatedDeclarations` |
| `HIDDEN`, en parte | `any` implícito; leer un índice como si siempre existiera | `strict`, `noUncheckedIndexedAccess` |
| `CLASS`, en parte | Propiedades de parámetro en el constructor | `erasableSyntaxOnly` |
| Sintaxis | `enum`, `namespace` | `erasableSyntaxOnly` |

**Hallazgos:**

1. **Con `noEmit`, `tsc` no informa los errores de `isolatedDeclarations`.** Hay que pedir las declaraciones (`emitDeclarationOnly` con `outDir`), aunque luego se descarten. El ejecutor las pide de forma explícita con `getDeclarationDiagnostics()`. Esas mismas declaraciones son la materia prima del mapa de superficie.
2. **La mitad de `WORLD` es configuración, no regla.** Lo que el código no puede nombrar, no lo puede usar. Lo que queda para la regla propia es lo que pertenece al propio ECMAScript: `Date`, `Math.random`, `globalThis` y lo que se alcance por él. Consecuencia de diseño: el punto de entrada necesita su propia configuración, con los tipos de Node, y el resto del código otra sin ellos. TypeScript lo permite con referencias entre proyectos.
3. **Sin regla propia pasa todo lo demás:** exportar estado mutable, `throw`, `class`, `export default`, ocultar nombres, lambdas que escriben fuera, `eval`, `new Function`, `import()` con ruta variable, llamadas en el nivel superior, recursos sin `using`, más de 7 parámetros, `any` explícito, `as`, `!`, `readonly` superficial y los comentarios `@ts-ignore`, `@ts-expect-error` y `@ts-nocheck`.
4. **Hacen falta celdas de varios archivos** para lo que no cabe en uno: `export *`, los ciclos de `LAYER`, reasignar un binding importado y `verbatimModuleSyntax`. El ejecutor de hoy solo mide celdas de un archivo.

**El ejecutor** ([run.ts](../run.ts) y [src/](../src/)) está escrito según las reglas propuestas: solo `main` toca el exterior, los fallos son valores, no hay clases y los parámetros que no se modifican son `Readonly`. Pasa `tsc` con la configuración raíz ([tsconfig.json](../tsconfig.json)). Que cumpla las reglas propias no está comprobado, porque todavía no existen.

## 11. Reglas implementadas

9 de noviembre de 2026, TypeScript 6.0.3 y Node v24.16.0.

El autor pidió reglas claras que **ayuden a construir y faciliten el desarrollo**, con excepciones documentadas que conserven el contexto que una optimización del código podría ocultar. Delegó la evaluación de las reglas propuestas y de las que faltaban con ese criterio. Las decisiones que siguen se tomaron por esa delegación.

**Qué existe:**

- [audit.ts](../audit.ts) audita un proyecto que tenga un `harness.json`. Termina con 0 si no hay hallazgos, 1 si los hay y 2 si no pudo auditar.
- [run.ts](../run.ts) mide las celdas de un archivo con `tsc` y con las reglas, y los proyectos de [fixtures/](../fixtures/) para lo que necesita varios archivos.
- El arnés se audita a sí mismo con su propio [harness.json](../harness.json) y no tiene hallazgos.

### Configuración de un proyecto

`harness.json` en la raíz:

```json
{
  "projects": ["tsconfig.json", "tools/tsconfig.json"],
  "entryPoints": ["tools/*.ts"],
  "tests": ["tests/**/*.ts"],
  "layers": { "engine": ["engine"], "app": ["engine", "app"] }
}
```

- **`projects`:** los `tsconfig.json` que forman el proyecto. Cada archivo se audita una vez, con el primer proyecto que lo incluye.
- **`entryPoints`:** los archivos que pueden tocar el exterior. Cada uno declara una función `main`. Dentro de ellos no rigen `WORLD`, `ERROR` ni `IMPORT`.
- **`tests`:** las pruebas, con la misma exención y sin exigir `main`, porque su marco de pruebas ejecuta código al cargarlas.
- **`layers`:** cada carpeta y las carpetas de las que puede importar. Una carpeta que no aparece no tiene restricción.

**Decidido:** la exención alcanza al archivo entero del punto de entrada, no solo a `main`. Partir un punto de entrada en `main` y funciones auxiliares que reciben capacidades es lo idiomático, pero exigir que todo acceso esté dentro de `main` empujaría código auxiliar hacia dentro de `main` sin contener más contexto: el archivo ya está declarado como frontera.

### Qué comprueba cada regla

| Regla | Comprueba | No comprueba (límite declarado) |
| --- | --- | --- |
| `STATE` | Exportar un `let` o un `var`. Exportar una `const` de tipo mutable: un arreglo o una tupla no `readonly`, un contenedor mutable (`Map`, `Set`, arreglos tipados), o un objeto con alguna propiedad o firma de índice no `readonly` | La mutabilidad a más de un nivel de profundidad. El estado privado de un módulo, que la celda `state_private_module_let` permite |
| `WORLD` | Fuera de puntos de entrada y pruebas: los globales del exterior (`Date`, `performance`, `crypto`, `process`, `console`, `fetch`, `globalThis`, `window`, `document`, `navigator`, `location`, `localStorage`, temporizadores, `requestAnimationFrame`, `EventSource`, `WebSocket` y otros), `Math.random` y los módulos de Node con efectos. Un nombre solo cuenta si resuelve a una declaración de biblioteca: un `location` local no es el exterior. Además, un punto de entrada sin `main` | Lo que hace una dependencia por dentro. Los módulos de Node considerados puros (`path`, `url`, `util`, `zlib`, `buffer`, `string_decoder`, `querystring`) se permiten |
| `CONTEXT` | Un parámetro con tipo escrito y mutable que la función nunca escribe: debe ser `readonly`. Cuentan como escritura la asignación, el incremento o `delete` a través de él, llamar a un método que no está en la lista de lectura, y dejarlo escapar (como argumento, valor de retorno, inicializador o elemento de un literal) | `Readonly<T>` es superficial. Los métodos de una clase de biblioteca pueden cambiar el objeto aunque sus propiedades sean `readonly`. Al dejar escapar un parámetro se lo da por escrito, así que la regla solo marca lo que claramente no se toca |
| `ERROR` | `throw` y `Promise.reject` fuera de puntos de entrada y pruebas | Lo que lanzan por dentro el lenguaje y las bibliotecas (`JSON.parse`) |
| `CLASS` | Declaraciones y expresiones `class` en el código propio | Usar clases de bibliotecas (`Map`, `Error`) se permite |
| `SURFACE` | `export default`, `export *` y `export * as`. Con `isolatedDeclarations`, `tsc` ya exige tipos explícitos en lo exportado | — |
| `LAYER` | Ciclos de importación entre los archivos auditados, y las importaciones que cruzan las capas declaradas. Las importaciones de solo tipos cuentan: también son contexto que hay que leer | Importaciones de paquetes externos |
| `NAME` | Un nombre que oculta otro de un ámbito que lo contiene, y un parámetro con el nombre de su función. Los ámbitos hermanos pueden repetir nombres | Nombres de otros módulos y globales |
| `LAMBDA` | Una función flecha o expresión de función que asigna, suma o incrementa una variable que capturó | Cambios a un objeto capturado mediante sus propiedades o métodos (la celda `lambda_mutates_capture_by_method` sigue siendo un `gap`) |
| `IMPORT` | Fuera de puntos de entrada y pruebas, una sentencia del nivel superior que no es declaración (se ejecuta al importar). En cualquier archivo, `import()` con ruta no literal, `require`, `eval`, `Function` y `new Function` | — |
| `RELEASE` | Un valor `Disposable` o `AsyncDisposable` declarado sin `using` o `await using` | Recursos de bibliotecas que no implementan `Disposable` |
| `SIZE` | Más de 7 parámetros | Límites de líneas, que se fijan después de medir proyectos reales |
| `HIDDEN` | `any` explícito, `as` (salvo `as const`), `<T>x` y la aserción no nula `!` | `any` dentro de los tipos de una dependencia |
| `BYPASS` | `@ts-ignore`, `@ts-expect-error` y `@ts-nocheck` | Banderas de `tsc` relajadas desde fuera del código |
| `HEADER` (nueva) | Que el módulo empiece con un comentario que diga para qué sirve. No cuentan las directivas `// rule:`, `// reason:` ni `// harness-allow` | La calidad de lo que el comentario dice |
| `ALLOW` (nueva) | Las excepciones mal escritas (regla desconocida o motivo de menos de 12 caracteres) y las que no silencian nada | Que el motivo sea verdadero |
| `TSC` | Los diagnósticos de `tsc` con la configuración del proyecto, para que la auditoría sirva sola | — |

### Decisiones tomadas el 9 de noviembre de 2026, por delegación

1. **`IMPORT` se ajusta.** Una `const` calculada al cargar el módulo se permite, aunque llame a una función. Se rechazan las sentencias sueltas del nivel superior.
   - Una tabla calculada (`new Map([...])`, una conversión de unidades) no es un efecto, y `WORLD` ya impide que toque el exterior.
   - Obligar a que todo valor exportado sea un literal empujaría las tablas a funciones que se llaman una y otra vez, sin contener más contexto.
   - La celda `import_top_level_call` pasa de `gap` a `control`. Lo que sigue prohibido es lo que de verdad ejecuta algo al importar: una sentencia como `register()` o `values.push(1)`.
2. **`HEADER` es nueva.** Lo primero que lee un modelo al abrir un archivo es su comentario inicial. Si falta, tiene que leer el código entero para saber para qué sirve.
3. **Excepciones documentadas (`ALLOW`), nueva.**
   - Se escriben `// harness-allow REGLA: motivo`, o varias reglas separadas por comas, sobre la línea afectada o al final de ella.
   - Silencian solo esa línea y esas reglas. El motivo es obligatorio: es el contexto que la excepción conserva.
   - Cada excepción aparece en el informe de la auditoría con su motivo.
   - Una excepción que ya no silencia nada es un hallazgo, para que no se acumulen sin leer.
   - Solo cuentan los comentarios verdaderos: las mismas palabras dentro de un texto o de otro comentario no son una excepción.
   - `TSC` y `ALLOW` no se pueden silenciar. `BYPASS` sigue prohibiendo apagar `tsc`.
   - Sigue siendo **un solo perfil**: no hay modo relajado, solo excepciones de una línea, con nombre y motivo.
4. **`CONTEXT` es conservadora.** Dar por escrito un parámetro que escapa evita marcar como error lo que no se puede saber sin seguir la llamada. La regla atrapa los casos claros: un arreglo que solo se recorre, un objeto que solo se lee.
5. **`WORLD` y `ERROR` eximen también a las pruebas,** declaradas aparte de los puntos de entrada, porque `node:test` ejecuta código al cargar el archivo y lee datos de prueba.

### Medición

| | Resultado |
|---|---|
| Celdas de un archivo | 69: 44 detenidas y 0 veredictos erróneos. Quedan 2 `gap`, que son límites declarados: `Readonly<T>` superficial y la mutación de una captura mediante un método |
| Proyectos de [fixtures/](../fixtures/) | `clean` sin hallazgos; `layers`, un ciclo y un cruce de capas; `surface`, `export *` y `export * as` |
| Autoauditoría | 11 archivos, 0 hallazgos, 0 excepciones |

**Comprobado con defectos.** Hacen fallar alguna celda o proyecto de prueba:

- apagar `LAMBDA`;
- declarar inmutable todo tipo (fallan `STATE` y `CONTEXT`);
- quitar la detección de ciclos;
- aceptar cualquier excepción;
- no contar las llamadas a métodos como escritura.

**No lo detecta:** que `ALLOW` pueda silenciarse a sí misma. El lector de excepciones ya rechaza `ALLOW` como regla, así que esa segunda protección no tiene efecto visible.

**Fallos encontrados al implementar,** corregidos cada uno junto con una celda que lo vigila:

- `RELEASE` tomaba toda `const` por `using`, porque en TypeScript `AwaitUsing` es `Const | Using` (celda `release_without_using`).
- `globalThis` no se reconocía como externo, porque su símbolo no tiene declaraciones (celda `world_global_this_date`).
- `Readonly<T>` guarda su marca en los enlaces internos del símbolo, no en el símbolo mismo, así que un objeto `Readonly` se veía mutable (celda `state_exported_readonly_object`).
- Un `// harness-allow` dentro de un texto contaba como excepción (celda `allow_in_string`).

### Cómo se usa en un proyecto

```sh
node ../TS-Harness/audit.ts .    # desde la raíz del proyecto, con su harness.json
```

Como validación antes de cada commit, un gancho `pre-commit` del proyecto puede ejecutar esa orden y abortar si termina con 1 o 2. Este repositorio hace lo mismo consigo mismo: `npm run check` corre `tsc`, las celdas, los proyectos de prueba y la autoauditoría.

### Qué falta

- **La hipótesis de la sección 1 sigue sin medir** (sección 9.3).
- **El mapa de superficie** (sección 4).
- **`CONTEXT` profundo** y la mutación a través de métodos en `LAMBDA`, si una medición muestra que vale su costo.
- **Límites de líneas en `SIZE`,** después de medir proyectos reales.
