import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { TargetPositionComponent, MovementState } from '../components/TargetPositionComponent';
import * as THREE from 'three';

export class PlayerControlSystem extends System {
    private keyStates: { [key: string]: boolean } = {};
    
    constructor() {
        super();
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

    private interruptClickToMove(): void {
        for (const entity of this.entities) {
            const targetPos = entity.getComponent(TargetPositionComponent);
            if (targetPos) {
                targetPos.movementState = MovementState.IDLE;
            }
            
            // Marcar que estamos usando control por teclado
            const player = entity.getComponent(PlayerComponent);
            if (player) {
                player.isUsingKeyboardControl = true;
            }
        }
    }
    
    protected isEntityCompatible(entity: Entity): boolean {
        return entity.hasComponent(PlayerComponent) && entity.hasComponent(TransformComponent);
    }
    
    public update(deltaTime: number): void {
        for (const entity of this.entities) {
            const player = entity.getComponent(PlayerComponent);
            const transform = entity.getComponent(TransformComponent);
            
            if (player && transform) {
                // Movement direction vector
                const moveDirection = new THREE.Vector3(0, 0, 0);
                
                // Forward/backward (Z axis)
                const movingForward = this.keyStates['KeyW'] || this.keyStates['ArrowUp'];
                const movingBackward = this.keyStates['KeyS'] || this.keyStates['ArrowDown'];
                
                if (movingForward) {
                    moveDirection.z -= 1; // Forward is -Z (matches our model's front)
                }
                if (movingBackward) {
                    moveDirection.z += 1; // Backward is +Z
                }
                
                // Left/right (X axis)
                const movingLeft = this.keyStates['KeyA'] || this.keyStates['ArrowLeft'];
                const movingRight = this.keyStates['KeyD'] || this.keyStates['ArrowRight'];
                
                if (movingLeft) {
                    moveDirection.x -= 1; // Left is -X
                }
                if (movingRight) {
                    moveDirection.x += 1; // Right is +X
                }
                
                // Determinar la dirección de rotación basada en las teclas presionadas
                let targetRotationY = transform.rotation.y; // Mantener rotación actual por defecto
                let shouldRotate = false;
                
                // Priorizar rotación según las teclas presionadas
                if ((movingLeft || movingRight) && !(movingLeft && movingRight)) {
                    // Si solo se presiona izquierda o derecha (no ambas)
                    targetRotationY = movingLeft ? Math.PI / 2 : -Math.PI / 2;
                    shouldRotate = true;
                } else if ((movingForward || movingBackward) && !(movingForward && movingBackward)) {
                    // Si solo se presiona adelante o atrás (no ambas)
                    targetRotationY = movingForward ? 0 : Math.PI;
                    shouldRotate = true;
                } else if (movingForward && movingLeft) {
                    // Diagonal adelante-izquierda
                    targetRotationY = Math.PI / 4;
                    shouldRotate = true;
                } else if (movingForward && movingRight) {
                    // Diagonal adelante-derecha
                    targetRotationY = -Math.PI / 4;
                    shouldRotate = true;
                } else if (movingBackward && movingLeft) {
                    // Diagonal atrás-izquierda
                    targetRotationY = 3 * Math.PI / 4;
                    shouldRotate = true;
                } else if (movingBackward && movingRight) {
                    // Diagonal atrás-derecha
                    targetRotationY = -3 * Math.PI / 4;
                    shouldRotate = true;
                }
                
                // Aplicar rotación hacia la dirección de movimiento
                if (shouldRotate) {
                    // Asegurarse de que la rotación esté dentro del rango correcto
                    const rotationSpeed = player.turnSpeed * deltaTime;
                    
                    // Calcular el ángulo más corto para girar
                    let angleDiff = targetRotationY - transform.rotation.y;
                    
                    // Normalizar la diferencia de ángulo a [-PI, PI]
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                    
                    // Aplicar la rotación (con límite de velocidad)
                    const rotationStep = Math.min(rotationSpeed, Math.abs(angleDiff));
                    transform.rotation.y += rotationStep * Math.sign(angleDiff);
                    
                    // Simplificar el vector de movimiento para que se mueva hacia adelante en su nueva dirección
                    moveDirection.set(0, 0, -1);
                }
                
                // Actualizar estado de movimiento
                const isMoving = moveDirection.length() > 0;
                player.isMoving = isMoving;
                
                // Si estamos usando alguna tecla de movimiento, marcamos como control por teclado
                if (isMoving) {
                    player.isUsingKeyboardControl = true;
                } else {
                    // Si no estamos moviendo con teclado, verificamos si hay movimiento click-to-move
                    const targetPos = entity.getComponent(TargetPositionComponent);
                    if (targetPos && targetPos.movementState !== MovementState.IDLE) {
                        // Si hay movimiento click-to-move activo, no estamos usando teclado
                        player.isUsingKeyboardControl = false;
                        player.isMoving = true;
                    } else {
                        player.isMoving = false;
                    }
                }
                
                // Normalize for consistent speed in all directions
                if (isMoving) {
                    moveDirection.normalize();
                }
                
                // Apply movement relative to the player's facing direction
                const speed = player.moveSpeed * deltaTime;
                const movement = moveDirection.multiplyScalar(speed);
                
                // Create a quaternion from current rotation
                const quaternion = new THREE.Quaternion();
                quaternion.setFromEuler(transform.rotation);
                
                // Apply rotation to movement vector (to move in facing direction)
                movement.applyQuaternion(quaternion);
                
                // Update position
                transform.position.add(movement);
                
                // Rotation (manual turning with Q/E keys)
                if (this.keyStates['KeyQ']) {
                    transform.rotation.y += player.turnSpeed * deltaTime; // Rotate left
                }
                if (this.keyStates['KeyE']) {
                    transform.rotation.y -= player.turnSpeed * deltaTime; // Rotate right
                }
            }
        }
    }
} 