import { System } from '../core/System';
import { UserSettings } from '../../config/UserSettings';
import { Entity } from '../core/Entity';

export class UISystem extends System {
    private userSettings: UserSettings;
    private menuButton!: HTMLButtonElement;
    private settingsModal!: HTMLDivElement;
    private modalVisible: boolean = false;
    
    constructor() {
        super();
        
        this.userSettings = UserSettings.getInstance();
        this.createUI();
    }
    
    protected isEntityCompatible(entity: Entity): boolean {
        // UI System doesn't need to process entities
        return false;
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
    
    public update(_deltaTime: number): void {
        // No update needed for UI
    }
}