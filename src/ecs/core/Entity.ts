import { Component } from './Component';

export class Entity {
    private static nextId: number = 0;
    public readonly id: number;
    private components: Map<Function, Component>;

    constructor() {
        this.id = Entity.nextId++;
        this.components = new Map();
    }

    public addComponent(component: Component): Entity {
        component.entity = this.id;
        this.components.set(component.constructor, component);
        return this;
    }

    public removeComponent(componentType: Function): Entity {
        this.components.delete(componentType);
        return this;
    }

    public getComponent<T extends Component>(componentType: { new(...args: any[]): T }): T | undefined {
        return this.components.get(componentType) as T;
    }

    public hasComponent(componentType: Function): boolean {
        return this.components.has(componentType);
    }
} 