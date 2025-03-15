import { World } from './ecs/core/World';
import { Entity } from './ecs/core/Entity';
import { TransformComponent } from './ecs/components/TransformComponent';
import { MeshComponent } from './ecs/components/MeshComponent';
import { PlayerComponent } from './ecs/components/PlayerComponent';
import { CameraComponent } from './ecs/components/CameraComponent';
import { TargetPositionComponent } from './ecs/components/TargetPositionComponent';
import { ModelComponent } from './ecs/components/ModelComponent';
import { RenderSystem } from './ecs/systems/RenderSystem';
import { PlayerControlSystem } from './ecs/systems/PlayerControlSystem';
import { ClickToMoveSystem } from './ecs/systems/ClickToMoveSystem';
import { UISystem } from './ecs/systems/UISystem';
import { CameraFollowSystem } from './ecs/systems/CameraFollowSystem';
import { ModelLoader } from './utils/ModelLoader';
import * as THREE from 'three';

class Game {
    private world: World;
    private lastTime: number = 0;
    private renderSystem: RenderSystem;
    private clickToMoveSystem: ClickToMoveSystem;
    private player!: Entity;

    constructor() {
        this.world = new World();
        
        // Add all systems
        this.renderSystem = new RenderSystem();
        this.clickToMoveSystem = new ClickToMoveSystem(this.world, this.renderSystem.getScene());
        const playerControlSystem = new PlayerControlSystem(this.clickToMoveSystem);
        const uiSystem = new UISystem();
        const cameraFollowSystem = new CameraFollowSystem(this.world);
        
        this.world.addSystem(playerControlSystem);
        this.world.addSystem(this.clickToMoveSystem);
        this.world.addSystem(cameraFollowSystem);
        this.world.addSystem(this.renderSystem);
        this.world.addSystem(uiSystem);
        
        // Create entities
        this.createEntities();
        
        // Start game loop
        this.gameLoop(0);
    }
    
    private async createEntities(): Promise<void> {
        // Create floor
        const floor = new Entity();
        floor.addComponent(new TransformComponent(new THREE.Vector3(0, 0, 0)));
        floor.addComponent(new MeshComponent(
            new THREE.Mesh(
                new THREE.PlaneGeometry(50, 50),
                new THREE.MeshStandardMaterial({ color: 0x999999 })
            )
        ));
        
        // Rotate floor to be horizontal
        const floorTransform = floor.getComponent(TransformComponent);
        if (floorTransform) {
            floorTransform.rotation.x = -Math.PI / 2;
        }
        
        this.world.addEntity(floor);
        
        // Create player
        this.player = new Entity();
        this.player.addComponent(new TransformComponent(new THREE.Vector3(0, 0.01, 0)));
        
        try {
            // Cargar el modelo del personaje
            const playerModel = await ModelLoader.loadModel('/models/character.fbx');
            
            // Cargar las animaciones
            const animations = await ModelLoader.loadAnimations([
                '/models/idle.fbx',
                '/models/walk.fbx',
                '/models/walk-back.fbx',
                '/models/dance.fbx'
            ]);
            
            // Añadir las animaciones al modelo
            playerModel.animations = animations;
            
            // Crear el componente del modelo
            const modelComponent = new ModelComponent(playerModel);
            this.player.addComponent(modelComponent);
            
            // Ajustar la escala y posición del modelo
            const playerTransform = this.player.getComponent(TransformComponent);
            if (playerTransform) {
                // Los modelos de Mixamo suelen necesitar esta escala
                playerTransform.scale.setScalar(0.01);
                // Rotar para que mire en la dirección correcta
                playerTransform.rotation.y = Math.PI;
            }
            
            this.player.addComponent(new PlayerComponent());
            this.player.addComponent(new TargetPositionComponent());
            
            this.world.addEntity(this.player);
        } catch (error) {
            console.error('Error loading player model:', error);
            // Fallback to cube if model loading fails
            this.createFallbackPlayer();
        }
        
        // Create camera
        const camera = new Entity();
        camera.addComponent(new TransformComponent(new THREE.Vector3(0, 5, 10)));
        const cameraComponent = new CameraComponent(
            75, // fov
            window.innerWidth / window.innerHeight, // aspect
            0.1, // near
            1000 // far
        );
        camera.addComponent(cameraComponent);
        
        this.world.addEntity(camera);
        
        // Set camera entity in render system
        this.renderSystem.setCameraEntity(camera);
        
        // Set camera in click-to-move system
        this.clickToMoveSystem.setCamera(cameraComponent.camera);
        
        // Create some obstacles
        for (let i = 0; i < 10; i++) {
            const obstacle = new Entity();
            const x = Math.random() * 40 - 20;
            const z = Math.random() * 40 - 20;
            
            obstacle.addComponent(new TransformComponent(new THREE.Vector3(x, 0.5, z)));
            obstacle.addComponent(new MeshComponent(
                new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial({ color: 0xff0000 })
                )
            ));
            
            this.world.addEntity(obstacle);
        }
    }

    private createFallbackPlayer(): void {
        // Create a more distinctive player model that shows direction
        const playerGroup = new THREE.Group();
        
        // Main body (slightly elongated)
        const bodyGeometry = new THREE.BoxGeometry(0.8, 2, 1.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2288ff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        playerGroup.add(body);
        
        // Front indicator (arrow head)
        const arrowGeometry = new THREE.ConeGeometry(0.4, 0.8, 4);
        const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0x44aaff });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.z = -0.8; // Move forward
        arrow.rotation.x = Math.PI / 2; // Point forward
        playerGroup.add(arrow);
        
        this.player.addComponent(new MeshComponent(playerGroup));
        this.player.addComponent(new PlayerComponent());
        this.player.addComponent(new TargetPositionComponent());
        
        this.world.addEntity(this.player);
    }
    
    private gameLoop(time: number): void {
        requestAnimationFrame((t) => this.gameLoop(t));
        
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        this.world.update(deltaTime);
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    new Game();
    
    // Instructions
    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.left = '10px';
    instructions.style.color = 'white';
    instructions.style.fontFamily = 'Arial, sans-serif';
    instructions.style.padding = '10px';
    instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    instructions.style.borderRadius = '5px';
    instructions.innerHTML = `
        <h2>Controls:</h2>
        <p>Move: WASD or Arrow Keys</p>
        <p>Camera Orbit: Hold Right Mouse Button</p>
        <p>Click-to-Move: Left Mouse Button on terrain</p>
        <p>Settings: Click the ⚙️ button in top-right corner</p>
    `;
    document.body.appendChild(instructions);
}); 