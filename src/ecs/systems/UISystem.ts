import { System } from '../core/System';
import { UserSettings } from '../../config/UserSettings';
import { Entity } from '../core/Entity';
import { PlayerComponent } from '../components/PlayerComponent';
import { ModelComponent } from '../components/ModelComponent';

export class UISystem extends System {
    private userSettings: UserSettings;
    private menuButton!: HTMLButtonElement;
    private settingsModal!: HTMLDivElement;
    private modalVisible: boolean = false;
    private actionsButton!: HTMLButtonElement;
    private actionsMenu!: HTMLDivElement;
    private isMenuOpen: boolean = false;
    private currentAnimation: string | null = null;
    
    constructor() {
        super();
        
        this.userSettings = UserSettings.getInstance();
        this.createUI();
        this.createActionsUI();
    }
    
    protected isEntityCompatible(entity: Entity): boolean {
        return entity.hasComponent(PlayerComponent) && 
               entity.hasComponent(ModelComponent);
    }
    
    private createUI(): void {
        // Create menu button
        this.menuButton = document.createElement('button');
        this.menuButton.textContent = '⚙️ Configuración';
        this.menuButton.style.position = 'absolute';
        this.menuButton.style.top = '10px';
        this.menuButton.style.right = '10px';
        this.menuButton.style.padding = '8px 12px';
        this.menuButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.menuButton.style.color = 'white';
        this.menuButton.style.border = 'none';
        this.menuButton.style.borderRadius = '4px';
        this.menuButton.style.cursor = 'pointer';
        this.menuButton.style.zIndex = '100';
        
        // Create settings modal (initially hidden)
        this.settingsModal = document.createElement('div');
        this.settingsModal.style.position = 'absolute';
        this.settingsModal.style.top = '50%';
        this.settingsModal.style.left = '50%';
        this.settingsModal.style.transform = 'translate(-50%, -50%)';
        this.settingsModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.settingsModal.style.color = 'white';
        this.settingsModal.style.padding = '20px';
        this.settingsModal.style.borderRadius = '8px';
        this.settingsModal.style.minWidth = '300px';
        this.settingsModal.style.zIndex = '101';
        this.settingsModal.style.display = 'none';
        
        // Add settings content
        this.settingsModal.innerHTML = `
            <h2 style="text-align: center; margin-top: 0;">Configuración de Cámara</h2>
            
            <div style="margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <label for="invertCameraX">Invertir cámara horizontal:</label>
                    <input type="checkbox" id="invertCameraX" ${this.userSettings.invertCameraX ? 'checked' : ''}>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <label for="invertCameraY">Invertir cámara vertical:</label>
                    <input type="checkbox" id="invertCameraY" ${this.userSettings.invertCameraY ? 'checked' : ''}>
                </div>
                
                <div style="display: flex; flex-direction: column; margin: 15px 0;">
                    <label for="cameraRotationSpeed">Velocidad de rotación: <span id="rotationSpeedValue">${this.userSettings.cameraRotationSpeed}</span></label>
                    <input type="range" id="cameraRotationSpeed" min="0.2" max="2.5" step="0.1" 
                           value="${this.userSettings.cameraRotationSpeed}" 
                           style="width: 100%;"
                           oninput="document.getElementById('rotationSpeedValue').textContent = this.value">
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button id="saveSettings" style="padding: 8px 15px; margin-right: 10px; background-color: #2C8CFF; color: white; border: none; border-radius: 4px; cursor: pointer;">Guardar</button>
                <button id="closeModal" style="padding: 8px 15px; background-color: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Cerrar</button>
            </div>
        `;
        
        // Add elements to DOM
        document.body.appendChild(this.menuButton);
        document.body.appendChild(this.settingsModal);
        
        // Stop propagation of click events on UI elements
        this.menuButton.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        
        this.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleModal();
        });
        
        this.settingsModal.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        
        this.settingsModal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Add event listeners for buttons in the modal
        const saveButton = this.settingsModal.querySelector('#saveSettings');
        if (saveButton) {
            saveButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.saveSettings();
            });
        }
        
        const closeButton = this.settingsModal.querySelector('#closeModal');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleModal();
            });
        }
        
        // Prevent propagation for checkbox events too
        const invertXCheckbox = this.settingsModal.querySelector('#invertCameraX');
        if (invertXCheckbox) {
            invertXCheckbox.addEventListener('mousedown', (e) => e.stopPropagation());
            invertXCheckbox.addEventListener('click', (e) => e.stopPropagation());
        }
        
        const invertYCheckbox = this.settingsModal.querySelector('#invertCameraY');
        if (invertYCheckbox) {
            invertYCheckbox.addEventListener('mousedown', (e) => e.stopPropagation());
            invertYCheckbox.addEventListener('click', (e) => e.stopPropagation());
        }
    }
    
    private toggleModal(): void {
        this.modalVisible = !this.modalVisible;
        this.settingsModal.style.display = this.modalVisible ? 'block' : 'none';
    }
    
    private saveSettings(): void {
        // Get input values
        const invertCameraX = document.getElementById('invertCameraX') as HTMLInputElement;
        const invertCameraY = document.getElementById('invertCameraY') as HTMLInputElement;
        const cameraRotationSpeed = document.getElementById('cameraRotationSpeed') as HTMLInputElement;
        
        // Update settings
        this.userSettings.invertCameraX = invertCameraX?.checked || false;
        this.userSettings.invertCameraY = invertCameraY?.checked || false;
        
        // Update rotation speed
        if (cameraRotationSpeed) {
            this.userSettings.cameraRotationSpeed = parseFloat(cameraRotationSpeed.value);
        }
        
        // Save settings
        this.userSettings.saveSettings();
        
        // Close modal
        this.toggleModal();
    }
    
    private createActionsUI(): void {
        // Create actions button
        this.actionsButton = document.createElement('button');
        this.actionsButton.innerHTML = '⚔️';
        this.actionsButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 25px;
            background-color: #4a5568;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        // Create actions menu
        this.actionsMenu = document.createElement('div');
        this.actionsMenu.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background-color: white;
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: none;
            z-index: 1000;
        `;

        // Create dance button
        const danceButton = document.createElement('button');
        danceButton.innerHTML = '💃 Bailar';
        danceButton.style.cssText = `
            display: block;
            width: 100%;
            padding: 8px 16px;
            border: none;
            background: none;
            text-align: left;
            cursor: pointer;
            font-size: 14px;
            color: #4a5568;
            border-radius: 4px;
            &:hover {
                background-color: #f7fafc;
            }
        `;

        danceButton.addEventListener('click', () => {
            this.toggleDanceAnimation();
            this.closeMenu();
        });

        this.actionsMenu.appendChild(danceButton);
        document.body.appendChild(this.actionsButton);
        document.body.appendChild(this.actionsMenu);

        // Add click listeners
        this.actionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.actionsMenu.contains(e.target as Node)) {
                this.closeMenu();
            }
        });
    }

    private toggleMenu(): void {
        this.isMenuOpen = !this.isMenuOpen;
        this.actionsMenu.style.display = this.isMenuOpen ? 'block' : 'none';
    }

    private closeMenu(): void {
        this.isMenuOpen = false;
        this.actionsMenu.style.display = 'none';
    }

    private toggleDanceAnimation(): void {
        const player = this.getPlayerEntity();
        if (!player) return;

        const modelComponent = player.getComponent(ModelComponent);
        if (!modelComponent) return;

        if (this.currentAnimation === 'dance') {
            modelComponent.playAnimation('idle');
            this.currentAnimation = null;
        } else {
            modelComponent.playAnimation('dance');
            this.currentAnimation = 'dance';
        }
    }

    private getPlayerEntity(): Entity | null {
        for (const entity of this.entities) {
            if (entity.hasComponent(PlayerComponent)) {
                return entity;
            }
        }
        return null;
    }
    
    public update(deltaTime: number): void {
        // Actualizar el estado del UI si es necesario
    }
}