import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { TargetPositionComponent, MovementState } from '../components/TargetPositionComponent';
import { CameraComponent } from '../components/CameraComponent';
import { ModelComponent } from '../components/ModelComponent';
import { World } from '../core/World';
import { UserSettings } from '../../config/UserSettings';
import * as THREE from 'three';
import gsap from 'gsap';

export class ClickToMoveSystem extends System {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private camera: THREE.PerspectiveCamera | null = null;
    private floorY: number = 0; // Ajustado a 0 para coincidir con el plano del suelo
    private world: World;
    private entityMap: Map<number, Entity> = new Map();
    private targetIndicator: THREE.Group;
    private scene: THREE.Scene | null = null;
    private userSettings: UserSettings;
    private indicatorMaterials: THREE.Material[] = [];
    private isIndicatorFading: boolean = false;
    private particleSystem: THREE.Points | null = null;
    private particleGeometry: THREE.BufferGeometry | null = null;
    private particlePositions: Float32Array | null = null;
    private particleSizes: Float32Array | null = null;
    private particleOpacities: Float32Array | null = null;
    private readonly NUM_PARTICLES = 100;
    private pulseLight: THREE.PointLight | null = null;
    private glowMesh: THREE.Mesh | null = null;
    private time: number = 0;
    private rotatingLights: THREE.PointLight[] = [];
    private isDestroyed: boolean = false;

    constructor(world: World, scene: THREE.Scene) {
        super();
        this.world = world;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.scene = scene;
        this.userSettings = UserSettings.getInstance();

        // Crear el indicador de movimiento
        this.targetIndicator = this.createTargetIndicator();
        this.targetIndicator.visible = false;
        
        // Hacer que el indicador no intercepte los raycast
        this.targetIndicator.traverse((object) => {
            if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
                object.raycast = () => {}; // Deshabilitar raycast para todos los objetos del indicador
            }
        });
        
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

    private createTargetIndicator(): THREE.Group {
        const group = new THREE.Group();

        // Crear base circular principal
        const createBase = () => {
            const geometry = new THREE.CircleGeometry(0.5, 32);
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color1: { value: new THREE.Color(0x00ffff) },  // Cian brillante
                    color2: { value: new THREE.Color(0x0088ff) }   // Azul eléctrico
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color1;
                    uniform vec3 color2;
                    varying vec2 vUv;
                    
                    void main() {
                        vec2 center = vec2(0.5, 0.5);
                        float dist = length(vUv - center) * 2.0;
                        
                        // Anillos pulsantes
                        float rings = sin(dist * 10.0 - time * 3.0) * 0.5 + 0.5;
                        
                        // Rotación de patrones
                        float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                        float spiral = sin(angle * 6.0 + time * 2.0 + dist * 5.0) * 0.5 + 0.5;
                        
                        // Mezcla de colores con efectos
                        vec3 color = mix(color1, color2, rings * spiral);
                        float alpha = (1.0 - dist) * (0.8 + sin(time * 2.0) * 0.2);
                        alpha *= smoothstep(1.0, 0.8, dist);
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const base = new THREE.Mesh(geometry, material);
            base.rotation.x = -Math.PI / 2;
            base.position.y = 0.01; // Ligeramente sobre el suelo
            this.indicatorMaterials.push(material);
            return base;
        };

        // Crear anillos de energía
        const createEnergyRings = () => {
            const rings = new THREE.Group();
            
            for (let i = 0; i < 3; i++) {
                const geometry = new THREE.RingGeometry(0.3 + i * 0.15, 0.35 + i * 0.15, 32);
                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0 },
                        color: { value: new THREE.Color(0x00ffff) }
                    },
                    vertexShader: `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform float time;
                        uniform vec3 color;
                        varying vec2 vUv;
                        
                        void main() {
                            float pulse = sin(time * 2.0 + vUv.x * 6.28) * 0.5 + 0.5;
                            float alpha = pulse * 0.5;
                            gl_FragColor = vec4(color, alpha);
                        }
                    `,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });

                const ring = new THREE.Mesh(geometry, material);
                ring.rotation.x = -Math.PI / 2;
                ring.position.y = 0.02 + i * 0.01;
                rings.add(ring);
                this.indicatorMaterials.push(material);
            }
            
            return rings;
        };

        // Sistema de partículas mejorado
        const createParticles = () => {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(this.NUM_PARTICLES * 3);
            const colors = new Float32Array(this.NUM_PARTICLES * 3);
            const sizes = new Float32Array(this.NUM_PARTICLES);
            const opacities = new Float32Array(this.NUM_PARTICLES);
            const speeds = new Float32Array(this.NUM_PARTICLES);

            for (let i = 0; i < this.NUM_PARTICLES; i++) {
                const i3 = i * 3;
                const angle = (i / this.NUM_PARTICLES) * Math.PI * 2;
                const radius = Math.random() * 0.3;
                
                positions[i3] = Math.cos(angle) * radius;
                positions[i3 + 1] = Math.random() * 0.1; // Altura inicial aleatoria
                positions[i3 + 2] = Math.sin(angle) * radius;

                // Colores más brillantes y variados
                const hue = Math.random() * 0.1 + 0.5; // Rango de azul a cian
                const color = new THREE.Color().setHSL(hue, 1, 0.8);
                colors[i3] = color.r;
                colors[i3 + 1] = color.g;
                colors[i3 + 2] = color.b;

                // Tamaños más variados
                sizes[i] = Math.random() * 0.06 + 0.02;
                opacities[i] = Math.random() * 0.7 + 0.3;
                speeds[i] = Math.random() * 0.5 + 0.5; // Velocidades variables
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
            geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 }
                },
                vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    attribute float opacity;
                    attribute float speed;
                    varying vec3 vColor;
                    varying float vOpacity;
                    uniform float time;
                    
                    void main() {
                        vColor = color;
                        
                        // Movimiento ascendente con velocidad variable
                        vec3 pos = position;
                        float t = time * speed;
                        float yOffset = mod(t, 2.0);
                        
                        // Movimiento en espiral
                        float spiralRadius = 0.15 * (1.0 - yOffset * 0.5);
                        float spiralAngle = t * 4.0;
                        pos.x += sin(spiralAngle) * spiralRadius;
                        pos.z += cos(spiralAngle) * spiralRadius;
                        
                        // Movimiento vertical con aceleración y desvanecimiento
                        pos.y = yOffset;
                        float fadeOut = smoothstep(2.0, 1.5, yOffset);
                        vOpacity = opacity * fadeOut;
                        
                        // Tamaño variable con la altura
                        float dynamicSize = size * (1.0 - yOffset * 0.3);
                        
                        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                        gl_PointSize = dynamicSize * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    varying float vOpacity;
                    
                    void main() {
                        // Forma suave de partícula con brillo central
                        vec2 center = gl_PointCoord - vec2(0.5);
                        float dist = length(center);
                        float alpha = smoothstep(0.5, 0.2, dist) * vOpacity;
                        
                        // Añadir brillo central
                        float glow = exp(-dist * 8.0) * 0.5;
                        vec3 finalColor = vColor + glow;
                        
                        gl_FragColor = vec4(finalColor, alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const particles = new THREE.Points(geometry, material);
            this.particleSystem = particles;
            this.particleGeometry = geometry;
            this.indicatorMaterials.push(material);
            return particles;
        };

        // Añadir elementos al grupo
        group.add(createBase());
        group.add(createEnergyRings());
        group.add(createParticles());

        // Sistema de luces
        const createLights = () => {
            // Luz central
            this.pulseLight = new THREE.PointLight(0x00ffff, 1, 2);
            this.pulseLight.position.set(0, 0.5, 0);
            group.add(this.pulseLight);

            // Luces orbitantes
            const colors = [0x00ffff, 0x0088ff, 0x00aaff];
            for (let i = 0; i < 3; i++) {
                const light = new THREE.PointLight(colors[i], 0.5, 1);
                const angle = (i / 3) * Math.PI * 2;
                light.position.set(
                    Math.cos(angle) * 0.5,
                    0.2,
                    Math.sin(angle) * 0.5
                );
                this.rotatingLights.push(light);
                group.add(light);
            }
        };

        createLights();
        return group;
    }

    private showIndicator(position: THREE.Vector3): void {
        this.isDestroyed = false;
        this.isIndicatorFading = false;
        this.time = 0;

        this.targetIndicator.position.copy(position);
        this.targetIndicator.position.y = 0;
        this.targetIndicator.visible = true;

        // Animación de aparición
        this.targetIndicator.scale.set(0, 0, 0);
        gsap.to(this.targetIndicator.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.5,
            ease: "elastic.out(1.2, 0.5)"
        });

        // Animación de las luces
        if (this.pulseLight) {
            this.pulseLight.intensity = 0;
            gsap.to(this.pulseLight, {
                intensity: 1,
                duration: 0.5,
                ease: "power2.out"
            });
        }
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
                this.showIndicator(targetPoint);
            }

            // Find the player entity and set its target position
            for (const entity of this.entities) {
                const targetPosComponent = entity.getComponent(TargetPositionComponent);
                const transform = entity.getComponent(TransformComponent);
                const player = entity.getComponent(PlayerComponent);
                
                if (targetPosComponent && transform && player) {
                    // Asegurarnos de que el punto objetivo esté en el plano del suelo
                    targetPoint.y = 0;
                    
                    // Set target position
                    targetPosComponent.targetPosition.copy(targetPoint);
                    
                    // Calculate direction to target for rotation
                    const direction = new THREE.Vector3()
                        .subVectors(targetPoint, transform.position)
                        .normalize();
                    
                    // Calculate target rotation angle (around Y axis)
                    targetPosComponent.targetRotation = Math.atan2(direction.x, direction.z);
                    
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
        this.time += deltaTime;

        if (this.targetIndicator.visible && !this.isDestroyed) {
            // Actualizar shaders
            this.indicatorMaterials.forEach(material => {
                if (material instanceof THREE.ShaderMaterial) {
                    material.uniforms.time.value = this.time;
                }
            });

            // Actualizar luces orbitantes
            this.rotatingLights.forEach((light, index) => {
                const angle = this.time * 2 + (index * Math.PI * 2 / 3);
                const radius = 0.5;
                light.position.x = Math.cos(angle) * radius;
                light.position.z = Math.sin(angle) * radius;
                light.intensity = 0.5 + Math.sin(this.time * 3 + index) * 0.2;
            });

            // Actualizar luz central
            if (this.pulseLight) {
                this.pulseLight.intensity = 0.8 + Math.sin(this.time * 2) * 0.2;
            }
        }

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
            const modelComponent = entity.getComponent(ModelComponent);

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
                        const distance = new THREE.Vector3(
                            targetPosition.x - currentPos.x,
                            0, // Ignorar diferencia en Y
                            targetPosition.z - currentPos.z
                        ).length();
                        
                        if (distance <= targetPos.reachedThreshold) {
                            // We've reached the target, stop moving
                            targetPos.movementState = MovementState.IDLE;
                            if (this.targetIndicator) {
                                this.hideTargetIndicator();
                            }
                            
                            // Ya no estamos en movimiento
                            player.isMoving = false;
                            player.isUsingKeyboardControl = false;

                            // Cambiar a animación idle
                            if (modelComponent && modelComponent.hasAnimation('idle')) {
                                modelComponent.playAnimation('idle');
                            }
                        } else {
                            // Calculate movement step
                            const direction = new THREE.Vector3()
                                .subVectors(targetPosition, currentPos)
                                .normalize();
                            direction.y = 0; // Asegurarnos de que no hay movimiento vertical
                            
                            const moveSpeed = player.moveSpeed * deltaTime;
                            const step = Math.min(moveSpeed, distance);
                            
                            // Update position
                            currentPos.add(direction.multiplyScalar(step));
                            currentPos.y = 0; // Mantener al personaje en el suelo
                        }
                        break;
                        
                    case MovementState.IDLE:
                        // No movement needed
                        break;
                }
            }
        }
    }

    public hideTargetIndicator(): void {
        if (this.targetIndicator && this.targetIndicator.visible && !this.isIndicatorFading && !this.isDestroyed) {
            this.isIndicatorFading = true;

            // Detener la animación de rebote
            gsap.killTweensOf(this.targetIndicator.position);

            // Animación de desaparición
            gsap.to(this.targetIndicator.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.3,
                ease: "back.in(1.7)",
                onComplete: () => {
                    this.targetIndicator.visible = false;
                    this.isIndicatorFading = false;
                    this.isDestroyed = true;
                }
            });

            // Desvanecer luz
            if (this.pulseLight) {
                gsap.to(this.pulseLight, {
                    intensity: 0,
                    duration: 0.3,
                    ease: "power2.in"
                });
            }

            // Desvanecer materiales
            this.indicatorMaterials.forEach(material => {
                if (material instanceof THREE.ShaderMaterial) {
                    gsap.to(material.uniforms.color.value, {
                        r: 0,
                        g: 0,
                        b: 0,
                        duration: 0.3,
                        ease: "power2.in"
                    });
                }
            });
        }
    }
} 