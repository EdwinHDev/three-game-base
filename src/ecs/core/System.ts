import { Entity } from './Entity';

export abstract class System {
    protected entities: Entity[] = [];

    public addEntity(entity: Entity): void {
        if (!this.entities.includes(entity) && this.isEntityCompatible(entity)) {
            this.entities.push(entity);
        }
    }

    public removeEntity(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    protected abstract isEntityCompatible(entity: Entity): boolean;
    
    public abstract update(deltaTime: number): void;
} 