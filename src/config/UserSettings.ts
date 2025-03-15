/**
 * UserSettings class to manage user configuration
 * Uses the Singleton pattern to ensure only one instance exists
 */
export class UserSettings {
    private static instance: UserSettings;
    
    // Default settings
    public invertCameraX: boolean = false;  // False = natural, True = inverted
    public invertCameraY: boolean = false;  // False = natural, True = inverted
    public cameraZoomSpeed: number = 1.0;   // Velocidad de zoom de la cámara
    public cameraMinDistance: number = 3;   // Distancia mínima al personaje
    public cameraMaxDistance: number = 15;  // Distancia máxima al personaje
    public cameraMinPolarAngle: number = Math.PI * 0.1;  // Límite superior de la cámara (mirar hacia arriba)
    public cameraMaxPolarAngle: number = Math.PI * 0.55; // Límite inferior de la cámara (reducido significativamente para asegurar que no atraviese el suelo)
    public enableCameraAutoRotation: boolean = true;     // Habilitar/deshabilitar rotación automática
    public cameraRotationSpeed: number = 0.8;            // Velocidad de rotación automática de la cámara (aumentada para mejor respuesta)
    
    // Private constructor prevents direct instantiation
    private constructor() {
        this.loadSettings();
    }
    
    /**
     * Get the singleton instance
     */
    public static getInstance(): UserSettings {
        if (!UserSettings.instance) {
            UserSettings.instance = new UserSettings();
        }
        return UserSettings.instance;
    }
    
    /**
     * Save settings to local storage
     */
    public saveSettings(): void {
        const settings = {
            invertCameraX: this.invertCameraX,
            invertCameraY: this.invertCameraY,
            cameraZoomSpeed: this.cameraZoomSpeed,
            cameraMinDistance: this.cameraMinDistance,
            cameraMaxDistance: this.cameraMaxDistance,
            cameraMinPolarAngle: this.cameraMinPolarAngle,
            cameraMaxPolarAngle: this.cameraMaxPolarAngle,
            enableCameraAutoRotation: this.enableCameraAutoRotation,
            cameraRotationSpeed: this.cameraRotationSpeed
        };
        
        localStorage.setItem('gameSettings', JSON.stringify(settings));
    }
    
    /**
     * Load settings from local storage
     */
    private loadSettings(): void {
        const savedSettings = localStorage.getItem('gameSettings');
        
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.invertCameraX = settings.invertCameraX ?? false;
                this.invertCameraY = settings.invertCameraY ?? false;
                this.cameraZoomSpeed = settings.cameraZoomSpeed ?? 1.0;
                this.cameraMinDistance = settings.cameraMinDistance ?? 3;
                this.cameraMaxDistance = settings.cameraMaxDistance ?? 15;
                this.cameraMinPolarAngle = settings.cameraMinPolarAngle ?? Math.PI * 0.1;
                this.cameraMaxPolarAngle = settings.cameraMaxPolarAngle ?? Math.PI * 0.55;
                this.enableCameraAutoRotation = settings.enableCameraAutoRotation ?? true;
                this.cameraRotationSpeed = settings.cameraRotationSpeed ?? 0.8;
            } catch (e) {
                console.error('Error loading settings:', e);
                // If there's an error, use defaults
            }
        }
    }
} 