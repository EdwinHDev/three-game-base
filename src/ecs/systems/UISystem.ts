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
            <h2 style="text-align: center; margin-top: 0;">Configuración</h2>
            
            <div style="margin: 15px 0;">
                <h3>Configuración de Cámara</h3>
                
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <label for="invertCameraX">Invertir cámara horizontal (ratón derecha = cámara izquierda):</label>
                    <input type="checkbox" id="invertCameraX" ${this.userSettings.invertCameraX ? 'checked' : ''}>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <label for="invertCameraY">Invertir cámara vertical (ratón abajo = cámara arriba):</label>
                    <input type="checkbox" id="invertCameraY" ${this.userSettings.invertCameraY ? 'checked' : ''}>
                </div>
                
                <div style="margin: 15px 0;">
                    <h4>Distancia de la Cámara</h4>
                    
                    <div style="display: flex; flex-direction: column; margin: 10px 0;">
                        <label for="cameraMinDistance">Distancia mínima: <span id="minDistanceValue">${this.userSettings.cameraMinDistance}</span></label>
                        <input type="range" id="cameraMinDistance" min="1" max="10" step="0.5" 
                               value="${this.userSettings.cameraMinDistance}" 
                               style="width: 100%;"
                               oninput="document.getElementById('minDistanceValue').textContent = this.value">
                    </div>
                    
                    <div style="display: flex; flex-direction: column; margin: 10px 0;">
                        <label for="cameraMaxDistance">Distancia máxima: <span id="maxDistanceValue">${this.userSettings.cameraMaxDistance}</span></label>
                        <input type="range" id="cameraMaxDistance" min="10" max="30" step="1" 
                               value="${this.userSettings.cameraMaxDistance}" 
                               style="width: 100%;"
                               oninput="document.getElementById('maxDistanceValue').textContent = this.value">
                    </div>
                    
                    <div style="display: flex; flex-direction: column; margin: 10px 0;">
                        <label for="cameraZoomSpeed">Velocidad de zoom: <span id="zoomSpeedValue">${this.userSettings.cameraZoomSpeed}</span></label>
                        <input type="range" id="cameraZoomSpeed" min="0.5" max="3" step="0.1" 
                               value="${this.userSettings.cameraZoomSpeed}" 
                               style="width: 100%;"
                               oninput="document.getElementById('zoomSpeedValue').textContent = this.value">
                    </div>

                    <h4>Restricciones de Ángulo</h4>
                    
                    <div style="display: flex; flex-direction: column; margin: 10px 0;">
                        <label for="cameraMinPolarAngle">Límite superior (grados): <span id="minPolarValue">${Math.round(this.userSettings.cameraMinPolarAngle * 180 / Math.PI)}</span></label>
                        <input type="range" id="cameraMinPolarAngle" min="5" max="45" step="1" 
                               value="${Math.round(this.userSettings.cameraMinPolarAngle * 180 / Math.PI)}" 
                               style="width: 100%;"
                               oninput="document.getElementById('minPolarValue').textContent = this.value">
                    </div>
                    
                    <div style="display: flex; flex-direction: column; margin: 10px 0;">
                        <label for="cameraMaxPolarAngle">Límite inferior (grados): <span id="maxPolarValue">${Math.round(this.userSettings.cameraMaxPolarAngle * 180 / Math.PI)}</span></label>
                        <input type="range" id="cameraMaxPolarAngle" min="90" max="120" step="1" 
                               value="${Math.round(this.userSettings.cameraMaxPolarAngle * 180 / Math.PI)}" 
                               style="width: 100%;"
                               oninput="document.getElementById('maxPolarValue').textContent = this.value">
                    </div>

                    <h4>Rotación Automática</h4>
                    
                    <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                        <label for="enableCameraAutoRotation">Rotar cámara automáticamente al moverse:</label>
                        <input type="checkbox" id="enableCameraAutoRotation" ${this.userSettings.enableCameraAutoRotation ? 'checked' : ''}>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; margin: 10px 0;">
                        <label for="cameraRotationSpeed">Velocidad de rotación: <span id="rotationSpeedValue">${this.userSettings.cameraRotationSpeed}</span></label>
                        <input type="range" id="cameraRotationSpeed" min="0.2" max="2.5" step="0.1" 
                               value="${this.userSettings.cameraRotationSpeed}" 
                               style="width: 100%;"
                               oninput="document.getElementById('rotationSpeedValue').textContent = this.value">
                    </div>
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
        // Get checkbox values
        const invertCameraX = document.getElementById('invertCameraX') as HTMLInputElement;
        const invertCameraY = document.getElementById('invertCameraY') as HTMLInputElement;
        const cameraMinDistance = document.getElementById('cameraMinDistance') as HTMLInputElement;
        const cameraMaxDistance = document.getElementById('cameraMaxDistance') as HTMLInputElement;
        const cameraZoomSpeed = document.getElementById('cameraZoomSpeed') as HTMLInputElement;
        const cameraMinPolarAngle = document.getElementById('cameraMinPolarAngle') as HTMLInputElement;
        const cameraMaxPolarAngle = document.getElementById('cameraMaxPolarAngle') as HTMLInputElement;
        const enableCameraAutoRotation = document.getElementById('enableCameraAutoRotation') as HTMLInputElement;
        const cameraRotationSpeed = document.getElementById('cameraRotationSpeed') as HTMLInputElement;
        
        // Update settings
        this.userSettings.invertCameraX = invertCameraX?.checked || false;
        this.userSettings.invertCameraY = invertCameraY?.checked || false;
        
        // Update camera distance settings
        if (cameraMinDistance && cameraMaxDistance) {
            // Convert to numbers and ensure min is less than max
            const minDist = parseFloat(cameraMinDistance.value);
            const maxDist = parseFloat(cameraMaxDistance.value);
            
            // Ensure min is less than max
            if (minDist < maxDist) {
                this.userSettings.cameraMinDistance = minDist;
                this.userSettings.cameraMaxDistance = maxDist;
            } else {
                // Mantener la relación correcta
                this.userSettings.cameraMinDistance = minDist;
                this.userSettings.cameraMaxDistance = minDist + 5;
                
                // Actualizar el valor en la interfaz
                document.getElementById('maxDistanceValue')!.textContent = String(this.userSettings.cameraMaxDistance);
            }
        }
        
        // Update zoom speed
        if (cameraZoomSpeed) {
            this.userSettings.cameraZoomSpeed = parseFloat(cameraZoomSpeed.value);
        }
        
        // Update camera angle restrictions
        if (cameraMinPolarAngle && cameraMaxPolarAngle) {
            // Convert to radians (UI shows degrees for user-friendliness)
            const minAngle = parseFloat(cameraMinPolarAngle.value) * Math.PI / 180;
            const maxAngle = parseFloat(cameraMaxPolarAngle.value) * Math.PI / 180;
            
            // Ensure proper relationship (min < max)
            if (minAngle < maxAngle) {
                this.userSettings.cameraMinPolarAngle = minAngle;
                this.userSettings.cameraMaxPolarAngle = maxAngle;
            }
        }
        
        // Update auto-rotation settings
        this.userSettings.enableCameraAutoRotation = enableCameraAutoRotation?.checked || false;
        if (cameraRotationSpeed) {
            this.userSettings.cameraRotationSpeed = parseFloat(cameraRotationSpeed.value);
        }
        
        // Save to storage
        this.userSettings.saveSettings();
        
        // Close modal
        this.toggleModal();
    }
    
    public update(_deltaTime: number): void {
        // No need for updates in this system
    }
}