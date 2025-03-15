import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { TargetPositionComponent, MovementState } from '../components/TargetPositionComponent';
import { ModelComponent } from '../components/ModelComponent';
import { MeshComponent } from '../components/MeshComponent';
import { ClickToMoveSystem } from './ClickToMoveSystem';
import * as THREE from 'three';

export class PlayerControlSystem extends System {
    private keyStates: { [key: string]: boolean } = {};
    private currentAnimation: string = 'idle';
    private clickToMoveSystem: ClickToMoveSystem;
    private animationNames = {
        IDLE: ['idle'],
        WALK: ['walk', 'walk-back'],
        DANCE: ['dance']
    };
    
    constructor(clickToMoveSystem: ClickToMoveSystem) {
        super();
        this.clickToMoveSystem = clickToMoveSystem;
        
        // Set up event listeners for keyboard
        window.addEventListener('keydown', (e) => {
            this.keyStates[e.code] = true;
            // Interrupt click-to-move when any movement key is pressed
            if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                this.interruptClickToMove();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keyStates[e.code] = false;
        });
    }

    protected isEntityCompatible(entity: Entity): boolean {
        return entity.hasComponent(PlayerComponent) &&
               entity.hasComponent(TransformComponent) &&
               (entity.hasComponent(ModelComponent) || entity.hasComponent(MeshComponent));
    }

    private interruptClickToMove(): void {
        for (const entity of this.entities) {
            const targetPos = entity.getComponent(TargetPositionComponent);
            if (targetPos) {
                targetPos.movementState = MovementState.IDLE;
            }
        }
        // Ocultar el indicador de posición
        this.clickToMoveSystem.hideTargetIndicator();
    }

    private findAnimation(modelComponent: ModelComponent, types: string[]): string | null {
        for (const animName of types) {
            // Comprobar si la animación existe directamente por su nombre
            if (modelComponent.hasAnimation(animName)) {
                return animName;
            }
        }
        return null;
    }

    private updateAnimation(modelComponent: ModelComponent, isMoving: boolean, isMovingBackward: boolean = false) {
        let desiredAnimation: string | null = null;

        if (isMoving) {
            // Si está moviéndose hacia atrás, usar walk-back, si no, usar walk
            desiredAnimation = isMovingBackward ? 'walk-back' : 'walk';
        } else {
            desiredAnimation = 'idle';
        }

        // Solo cambiar la animación si es diferente a la actual y existe
        if (desiredAnimation && 
            this.currentAnimation !== desiredAnimation && 
            modelComponent.hasAnimation(desiredAnimation)) {
            console.log(`Playing animation: ${desiredAnimation}`);
            modelComponent.playAnimation(desiredAnimation);
            this.currentAnimation = desiredAnimation;
        }
    }
    
    public update(deltaTime: number): void {
        for (const entity of this.entities) {
            const player = entity.getComponent(PlayerComponent);
            const transform = entity.getComponent(TransformComponent);
            const targetPos = entity.getComponent(TargetPositionComponent);
            const modelComponent = entity.getComponent(ModelComponent);
            
            if (!player || !transform) continue;
            
            // Si hay movimiento por click activo y no estamos usando el teclado, no procesar input
            if (targetPos && targetPos.movementState !== MovementState.IDLE && !player.isUsingKeyboardControl) {
                if (modelComponent) {
                    this.updateAnimation(modelComponent, true, false);
                }
                continue;
            }
            
            // Movement direction vector
            const moveDirection = new THREE.Vector3(0, 0, 0);
            
            // Forward/backward (Z axis)
            const movingForward = this.keyStates['KeyW'] || this.keyStates['ArrowUp'];
            const movingBackward = this.keyStates['KeyS'] || this.keyStates['ArrowDown'];
            
            if (movingForward) {
                moveDirection.z += 1;
            }
            if (movingBackward) {
                moveDirection.z -= 1;
            }
            
            // Left/right rotation
            const rotatingLeft = this.keyStates['KeyA'] || this.keyStates['ArrowLeft'];
            const rotatingRight = this.keyStates['KeyD'] || this.keyStates['ArrowRight'];
            
            // Apply rotation based on A/D keys
            if (rotatingLeft) {
                transform.rotation.y += player.turnSpeed * deltaTime;
            }
            if (rotatingRight) {
                transform.rotation.y -= player.turnSpeed * deltaTime;
            }
            
            // Check if we're moving
            const isMoving = moveDirection.length() > 0;
            player.isMoving = isMoving;
            
            // Handle animations if we have a model component
            if (modelComponent) {
                if (isMoving) {
                    player.isUsingKeyboardControl = true;
                    if (targetPos) {
                        targetPos.movementState = MovementState.IDLE;
                    }
                } else if (player.isUsingKeyboardControl) {
                    player.isMoving = false;
                    player.isUsingKeyboardControl = false;
                }
                
                // Update animation state
                this.updateAnimation(modelComponent, player.isMoving, movingBackward);
            }
            
            if (isMoving) {
                // Apply movement
                moveDirection.normalize();
                const speed = player.moveSpeed * deltaTime;
                const movement = moveDirection.multiplyScalar(speed);
                
                // Create a quaternion from current rotation
                const quaternion = new THREE.Quaternion();
                quaternion.setFromEuler(transform.rotation);
                
                // Apply rotation to movement vector
                movement.applyQuaternion(quaternion);
                
                // Update position
                transform.position.add(movement);
            }
        }
    }
} 