import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { TargetPositionComponent, MovementState } from '../components/TargetPositionComponent';
import { CameraComponent } from '../components/CameraComponent';
import { World } from '../core/World';
import { UserSettings } from '../../config/UserSettings';
import * as THREE from 'three';

export class ClickToMoveSystem extends System {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private camera: THREE.PerspectiveCamera | null = null;
    private floorY: number = -0.5; // Y position of the floor
    private world: World;
    private entityMap: Map<number, Entity> = new Map();
    private targetIndicator: THREE.Mesh | null = null;
    private scene: THREE.Scene | null = null;
    private userSettings: UserSettings;

    constructor(world: World, scene: THREE.Scene) {
        super();
        this.world = world;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.scene = scene;
        this.userSettings = UserSettings.getInstance();

        // Create a visual indicator for the target position
        const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.targetIndicator = new THREE.Mesh(geometry, material);
        this.targetIndicator.visible = false;
        scene.add(this.targetIndicator);

        // Add mouse click event listener
        window.addEventListener('mousedown', (e) => {
            // Only process left mouse button (button = 0)
            if (e.button === 0) {
                // Check if click happened on a UI element by looking at event's target
                const target = e.target as HTMLElement;
                const isUIClick = this.isUIElement(target);
                
                // Only proceed if not clicking on UI
                if (!isUIClick) {
                    this.handleClick(e);
                }
            }
        });
    }

    // Helper method to check if an element is part of the UI
    private isUIElement(element: HTMLElement | null): boolean {
        // If not an element, it's not UI
        if (!element) return false;
        
        // Check if it's the settings modal or button (by class, id, or other identifiers)
        if (element.tagName === 'BUTTON' || 
            element.tagName === 'INPUT' || 
            element.closest('[id^="settings"]') ||
            element.getAttribute('role') === 'dialog') {
            return true;
        }
        
        // Check direct parent of the settings modal (modal container)
        if (element.style && 
            element.style.zIndex === '101' && 
            element.style.backgroundColor.includes('rgba(0, 0, 0')) {
            return true;
        }
        
        // Recursively check parent elements
        if (element.parentElement) {
            return this.isUIElement(element.parentElement);
        }
        
        return false;
    }

    public setCamera(camera: THREE.PerspectiveCamera): void {
        this.camera = camera;
    }

    private handleClick(event: MouseEvent): void {
        if (!this.camera) return;

        // Calculate mouse position in normalized device coordinates (-1 to +1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Create a horizontal plane at floor level to intersect with the ray
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.floorY);
        const targetPoint = new THREE.Vector3();

        // Calculate the point of intersection
        const ray = this.raycaster.ray;
        if (ray.intersectPlane(plane, targetPoint)) {
            // We've found an intersection with the floor plane
            if (this.targetIndicator) {
                this.targetIndicator.position.copy(targetPoint);
                this.targetIndicator.position.y += 0.05; // Slight offset to avoid z-fighting
                this.targetIndicator.visible = true;
            }

            // Find the player entity and set its target position
            for (const entity of this.entities) {
                const targetPosComponent = entity.getComponent(TargetPositionComponent);
                const transform = entity.getComponent(TransformComponent);
                const player = entity.getComponent(PlayerComponent);
                
                if (targetPosComponent && transform && player) {
                    // Set target position
                    targetPosComponent.targetPosition.copy(targetPoint);
                    
                    // Calculate direction to target for rotation
                    const direction = new THREE.Vector3()
                        .subVectors(targetPoint, transform.position)
                        .normalize();
                    
                    // Calculate target rotation angle (around Y axis)
                    // We want the front to face -Z, so we need to adjust the angle
                    targetPosComponent.targetRotation = Math.atan2(direction.x, direction.z) + Math.PI;
                    
                    // Start with rotation state
                    targetPosComponent.movementState = MovementState.ROTATING;
                    
                    // Actualizar estado del jugador
                    player.isUsingKeyboardControl = false;
                    player.isMoving = true;
                }
            }
        }
    }

    public addEntity(entity: Entity): void {
        if (this.isEntityCompatible(entity)) {
            this.entities.push(entity);
        }
        // Store all entities for reference
        this.entityMap.set(entity.id, entity);
    }

    public removeEntity(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
        this.entityMap.delete(entity.id);
    }

    protected isEntityCompatible(entity: Entity): boolean {
        return entity.hasComponent(PlayerComponent) && 
               entity.hasComponent(TransformComponent) && 
               entity.hasComponent(TargetPositionComponent);
    }

    // Helper function to normalize angle to range [-PI, PI]
    private normalizeAngle(angle: number): number {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    // Calculate the shortest angle difference between two angles
    private getAngleDifference(a1: number, a2: number): number {
        const diff = this.normalizeAngle(a2 - a1);
        return Math.abs(diff);
    }

    public update(deltaTime: number): void {
        // Update entityMap with all world entities
        for (const entity of this.world.getEntities()) {
            if (!this.entityMap.has(entity.id)) {
                this.entityMap.set(entity.id, entity);
            }
        }

        // Get camera entity to ensure we have the current camera for raycasting
        for (const entity of this.world.getEntities()) {
            if (entity.hasComponent(CameraComponent)) {
                const cameraComponent = entity.getComponent(CameraComponent);
                if (cameraComponent) {
                    this.camera = cameraComponent.camera;
                    break;
                }
            }
        }

        // Process movement for all player entities with target positions
        for (const entity of this.entities) {
            const transform = entity.getComponent(TransformComponent);
            const targetPos = entity.getComponent(TargetPositionComponent);
            const player = entity.getComponent(PlayerComponent);

            if (transform && targetPos && player) {
                switch (targetPos.movementState) {
                    case MovementState.ROTATING:
                        // Handle rotation towards target
                        const currentAngle = transform.rotation.y;
                        const targetAngle = targetPos.targetRotation;
                        
                        // Get the difference between current and target angle
                        const angleDiff = this.getAngleDifference(currentAngle, targetAngle);
                        
                        // Actualizar estado del jugador
                        player.isMoving = true;
                        player.isUsingKeyboardControl = false;
                        
                        if (angleDiff <= targetPos.rotationThreshold) {
                            // Rotation completed, move to next state
                            transform.rotation.y = targetAngle; // Set exact angle
                            targetPos.movementState = MovementState.MOVING;
                        } else {
                            // Calculate the step to rotate
                            const rotationSpeed = player.turnSpeed * deltaTime;
                            const rotationStep = Math.min(rotationSpeed, angleDiff);
                            
                            // Rotate towards target (take shortest path)
                            const diff = this.normalizeAngle(targetAngle - currentAngle);
                            const direction = diff > 0 ? 1 : -1;
                            
                            transform.rotation.y += rotationStep * direction;
                            transform.rotation.y = this.normalizeAngle(transform.rotation.y);
                        }
                        break;
                        
                    case MovementState.MOVING:
                        // Handle movement towards target
                        const currentPos = transform.position;
                        const targetPosition = targetPos.targetPosition;
                        
                        // Actualizar estado del jugador
                        player.isMoving = true;
                        player.isUsingKeyboardControl = false;
                        
                        // Check if we've reached the target
                        const distance = currentPos.distanceTo(targetPosition);
                        
                        if (distance <= targetPos.reachedThreshold) {
                            // We've reached the target, stop moving
                            targetPos.movementState = MovementState.IDLE;
                            if (this.targetIndicator) {
                                this.targetIndicator.visible = false;
                            }
                            
                            // Ya no estamos en movimiento
                            player.isMoving = false;
                        } else {
                            // Calculate direction to target
                            const direction = new THREE.Vector3()
                                .subVectors(targetPosition, currentPos)
                                .normalize();
                            
                            // Calculate movement step
                            const moveStep = player.moveSpeed * deltaTime;
                            
                            // Calculate the new position
                            const newPos = new THREE.Vector3()
                                .addVectors(currentPos, direction.multiplyScalar(moveStep));
                            
                            // Preserve the original Y position
                            newPos.y = currentPos.y;
                            
                            // Update position
                            transform.position.copy(newPos);
                        }
                        break;
                        
                    case MovementState.IDLE:
                        // Do nothing when idle
                        break;
                }
            }
        }
    }
} 