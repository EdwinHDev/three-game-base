import { Entity } from './Entity';
import { System } from './System';

export class World {
    private entities: Entity[] = [];
    private systems: System[] = [];
    private entitiesToAdd: Entity[] = [];
    private entitiesToRemove: Entity[] = [];

    public addEntity(entity: Entity): void {
        this.entitiesToAdd.push(entity);
    }

    public removeEntity(entity: Entity): void {
        this.entitiesToRemove.push(entity);
    }

    public addSystem(system: System): void {
        this.systems.push(system);
    }

    public update(deltaTime: number): void {
        // Add entities that were queued
        for (const entity of this.entitiesToAdd) {
            this.entities.push(entity);
            for (const system of this.systems) {
                system.addEntity(entity);
            }
        }
        this.entitiesToAdd = [];

        // Remove entities that were queued
        for (const entity of this.entitiesToRemove) {
            const index = this.entities.indexOf(entity);
            if (index !== -1) {
                this.entities.splice(index, 1);
                for (const system of this.systems) {
                    system.removeEntity(entity);
                }
            }
        }
        this.entitiesToRemove = [];

        // Update all systems
        for (const system of this.systems) {
            system.update(deltaTime);
        }
    }

    public getEntities(): Entity[] {
        return [...this.entities];
    }
} 