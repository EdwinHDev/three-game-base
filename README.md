# Three.js Game Base con ECS

Este proyecto es una base para crear juegos 3D en el navegador utilizando Three.js y siguiendo el patrón de arquitectura Entity Component System (ECS).

## Características

- Arquitectura ECS (Entity Component System)
- Cámara que sigue al jugador
- Controles básicos del jugador
- Sistema de renderizado con Three.js

## Requisitos

- Node.js

## Instalación

1. Clona este repositorio
2. Instala las dependencias:

```bash
npm install
```

## Ejecución

Para iniciar el servidor de desarrollo:

```bash
npm start
```

Luego, abre tu navegador en `http://localhost:9000`

## Controles

- **Movimiento**: WASD o Flechas del teclado
- **Rotación**: Q/E

## Estructura del proyecto

```
src/
  ├── ecs/
  │   ├── components/     # Componentes ECS (TransformComponent, MeshComponent, etc.)
  │   ├── systems/        # Sistemas ECS (RenderSystem, PlayerControlSystem, etc.)
  │   ├── entities/       # Entidades predefinidas
  │   └── core/           # Núcleo ECS (Component, Entity, System, World)
  └── index.ts            # Punto de entrada de la aplicación
```

## Cómo funciona el ECS

El patrón Entity Component System (ECS) es una arquitectura de diseño común en juegos, que separa:

- **Entidades**: Objetos del juego con un ID único
- **Componentes**: Datos puros que describen aspectos de la entidad
- **Sistemas**: Lógica que opera sobre grupos de entidades con componentes específicos

Esta arquitectura facilita la modularidad, la reutilización y el rendimiento.

## Extensión

Para agregar nuevas características:

1. Crea nuevos componentes en `src/ecs/components/`
2. Crea nuevos sistemas en `src/ecs/systems/`
3. Modifica `createEntities()` en `src/index.ts` para agregar nuevas entidades

## Licencia

ISC 