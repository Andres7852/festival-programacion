# Módulo 01 — Programación de shows
## Festival Picnic 2026 · API REST

API REST encargada de gestionar la grilla de shows del Festival Picnic 2026 (artistas, escenarios, días y horarios), asegurando la consistencia de horarios y la ausencia de conflictos de programación sobre una base de datos PostgreSQL compartida.

Construido siguiendo una **arquitectura limpia en cuatro capas** (Domain, Application, Infrastructure, Interface) con **Node.js**, **Express**, **TypeScript** y **Prisma**.

---

## 👥 Integrantes y aportes

| Integrante | Rol / Aportes principales |
|---|---|
| **Miguel Ángel Guarnizo Salazar** | Endpoint de consulta de shows por artista (`GET /api/shows/artista/:artistaId`), pruebas unitarias para paginación, filtros y borrado lógico (`test/list-shows.test.ts`, `test/delete-and-get-show.test.ts`), configuración de entorno (`.env.example`) y documentación general del proyecto. |
| **Andrés Ortega** | Modelado de la capa de dominio (`Show`, interfaz del repositorio `ShowsRepository`, jerarquía de errores de dominio `domain-errors.ts`), caso de uso `GetShowById` y estructura base de rutas HTTP. |
| **Juan Manuel Moreno Muñoz** | Casos de uso de creación, edición y borrado lógico (`CreateShow`, `UpdateShow`, `DeleteShow`), implementación de las reglas de negocio de cruces de horarios (409), repositorio con Prisma (`PrismaShowsRepository`) y scripts de ejecución. |

---

## 🚀 Instalación y ejecución

### 1. Requisitos previos
- Node.js versión 18 o superior.
- npm.
- Acceso a la base de datos PostgreSQL compartida del festival.

### 2. Configuración del entorno
Clonar el repositorio y situarse en la raíz del proyecto:
```bash
git clone https://github.com/Andres7852/festival-programacion.git
cd festival-programacion
```

Instalar las dependencias:
```bash
npm install
```

Crear el archivo `.env` a partir de `.env.example`:
```bash
cp .env.example .env
```
*(o copiarlo manualmente en Windows)* y definir la cadena de conexión suministrada por el docente:
```env
DATABASE_URL="postgresql://usuario:password@host:5432/postgres"
PORT=3000
```

### 3. Sincronizar Prisma
Generar el cliente de Prisma:
```bash
npm run sync
```
*(Nota: si solo se requiere generar el cliente sin volver a hacer pull a la BD, se puede ejecutar `npx prisma generate`).*

### 4. Iniciar el servidor
Para iniciar en modo desarrollo con recarga automática:
```bash
npm run dev
```
La API quedará escuchando en `http://localhost:3000/api/shows`.

---

## 🧪 Pruebas

### Pruebas unitarias
El proyecto cuenta con un conjunto de pruebas unitarias usando el test runner nativo de Node.js y repositorios en memoria (`FakeShowsRepository`):
```bash
npm test
```
Para validar los tipos de TypeScript:
```bash
npm run typecheck
```

### Pruebas oficiales del kit
Con la API encendida (`npm run dev`), ejecutar el runner oficial del kit:
```bash
node kit-estudiantes/pruebas/correr.mjs programacion http://localhost:3000
```

---

## 📌 Explicación de regla de negocio

### Regla: Un escenario no puede tener dos shows cruzados el mismo día (409 Conflict)

#### 1. ¿Qué valida?
Valida que dentro de un mismo escenario y en la misma fecha del festival, dos presentaciones artísticas no compartan una misma franja de tiempo ni se solapen parcialmente.
- Si un show está asignado al Escenario 1 el Día 1 de `21:00` a `22:30`, ningún otro show en ese escenario y día puede invadir dicho intervalo (por ejemplo, registrar `21:30–22:00` o `22:00–23:00` debe ser rechazado con código **409 Conflict**).
- **Caso especial permitido:** La regla estipula que dos shows sí pueden convivir si uno comienza exactamente en el momento en que termina el anterior. Por ejemplo, un show de `21:00` a `22:30` y otro de `22:30` a `23:00` en el mismo escenario conviven perfectamente, ya que no hay solapamiento de minutos.

#### 2. ¿En qué archivo está?
- **Lógica de la regla:** Se encuentra en `src/application/rules/show-rules.ts`.
  - La función `schedulesOverlap(startA, endA, startB, endB)` implementa la condición matemática de solapamiento:
    ```typescript
    export function schedulesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
      return startA < endB && startB < endA;
    }
    ```
    Al usar cadenas `HH:MM` en formato 24 horas con cero inicial, la comparación lexicográfica de texto coincide de forma exacta con la comparación cronológica.
  - La función `ensureBusinessRules` consulta al repositorio los shows activos del escenario para ese día (`findActiveByStageAndDay`) y comprueba si existe algún show cruzado. Si lo encuentra, lanza un `ConflictError`.
- **Invocación:** Se ejecuta dentro de los casos de uso:
  - `src/application/use-cases/create-show.ts` durante el flujo del `POST`.
  - `src/application/use-cases/update-show.ts` durante el flujo del `PATCH`, enviando el parámetro opcional `excludeShowId` para que el show que se está modificando no se compare contra sí mismo al actualizar otros atributos.

#### 3. ¿Cómo se probó?
- **Pruebas unitarias (`test/show-rules.test.ts`):**
  - Se probó la función matemática `schedulesOverlap` con pares de intervalos cruzados, anidados y estrictamente contiguos (`"21:00"–"22:30"` con `"22:30"–"23:00"` dando `false`).
  - Se probó que al intentar crear un show solapado se lanza `ConflictError`.
  - Se probó que al registrar un show con inicio contiguo a la hora de fin previa sí se completa exitosamente.
  - Se probó que el método `UpdateShow` permite editar sin generar un falso conflicto consigo mismo.
- **Prueba oficial del kit:**
  - Al ejecutar `node kit-estudiantes/pruebas/correr.mjs programacion http://localhost:3000`, la prueba pasa en verde:
    `✓ Regla: un escenario no puede tener shows cruzados (409)`.

---

## 🏛️ Estructura en cuatro capas

```
src/
├── domain/                    # Entidades, interfaces de repositorio y errores de negocio
│   ├── errors/
│   │   └── domain-errors.ts   # ValidationError (400), NotFoundError (404), ConflictError (409)
│   ├── show.ts                # Tipo Show
│   └── shows-repository.ts    # Interfaz ShowsRepository y contratos de datos
├── application/               # Casos de uso, validaciones y reglas de negocio
│   ├── rules/
│   │   └── show-rules.ts      # Validación de referencias existentes y reglas 409
│   ├── validators/
│   │   └── show-validators.ts # Validación de formatos (HH:MM), campos obligatorios y tipos
│   └── use-cases/             # CreateShow, GetShowById, ListShows, UpdateShow, DeleteShow, GetShowsByArtist
├── infrastructure/            # Implementaciones concretas de persistencia y clientes
│   ├── database/
│   │   └── prisma-client.ts   # Inicialización de Prisma con adaptador pg
│   └── repositories/
│       └── prisma-shows.repository.ts  # Implementación de ShowsRepository con Prisma Client
└── interface/                 # Adaptadores de entrada (Express, controladores y rutas)
    └── http/
        ├── create-app.ts      # Configuración de Express, middlewares y DI
        ├── error-handler.ts   # Mapeo de errores de dominio a respuestas HTTP JSON
        ├── shows.controller.ts# Controlador delgado (parseo, delegación y respuesta)
        └── shows.routes.ts    # Definición de rutas y verbos HTTP
```
