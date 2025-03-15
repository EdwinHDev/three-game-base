import { Component } from '../core/Component';
import { Group, AnimationMixer, AnimationAction, AnimationClip, LoopOnce, Object3D, Mesh } from 'three';
import { Entity } from '../core/Entity';

export class ModelComponent extends Component {
    public model: Group;
    private mixer: AnimationMixer;
    private currentAction: AnimationAction | null = null;
    private animations: Map<string, AnimationClip> = new Map();

    constructor(model: Group) {
        super();
        this.model = model;
        this.mixer = new AnimationMixer(model);

        // Registrar las animaciones disponibles
        if (model.animations) {
            model.animations.forEach(animation => {
                this.animations.set(animation.name, animation);
            });
        }

        // Configurar sombras
        model.traverse((object: Object3D) => {
            if (object instanceof Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });

        // Reproducir la animación idle al inicio
        if (this.hasAnimation('idle')) {
            this.playAnimation('idle');
        }
    }

    public update(deltaTime: number): void {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    public hasAnimation(name: string): boolean {
        return this.animations.has(name);
    }

    public playAnimation(name: string, loop: boolean = true): void {
        const animation = this.animations.get(name);
        
        if (!animation) {
            console.warn(`Animation "${name}" not found. Available animations:`, 
                Array.from(this.animations.keys()));
            return;
        }

        // Si hay una animación actual, hacer crossfade
        if (this.currentAction) {
            const newAction = this.mixer.clipAction(animation);
            
            // Configurar el loop
            if (!loop) {
                newAction.setLoop(LoopOnce, 1);
                newAction.clampWhenFinished = true;
            }

            // Ajustar la velocidad de la animación según el tipo
            if (name === 'walk' || name === 'walk-back') {
                newAction.timeScale = 1.2; // Aumentar ligeramente la velocidad de caminar
            } else {
                newAction.timeScale = 1.0; // Velocidad normal para otras animaciones
            }

            // Realizar el crossfade
            this.currentAction.fadeOut(0.5);
            newAction.reset().fadeIn(0.5).play();
            
            this.currentAction = newAction;
        } else {
            // Primera animación
            const action = this.mixer.clipAction(animation);
            
            if (!loop) {
                action.setLoop(LoopOnce, 1);
                action.clampWhenFinished = true;
            }

            // Ajustar la velocidad de la animación según el tipo
            if (name === 'walk' || name === 'walk-back') {
                action.timeScale = 1.2; // Aumentar ligeramente la velocidad de caminar
            } else {
                action.timeScale = 1.0; // Velocidad normal para otras animaciones
            }
            
            action.play();
            this.currentAction = action;
        }
    }

    public stopAnimation(): void {
        if (this.currentAction) {
            this.currentAction.stop();
            this.currentAction = null;
        }
    }
} 