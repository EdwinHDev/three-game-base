/**
 * UserSettings class to manage user configuration
 * Uses the Singleton pattern to ensure only one instance exists
 */
export class UserSettings {
    private static instance: UserSettings;
    
    // Default settings
    public invertCameraX: boolean = false;  // False = natural, True = inverted
    public invertCameraY: boolean = false;  // False = natural, True = inverted
    public cameraRotationSpeed: number = 0.5;   // Velocidad de rotación de la cámara (reducida)
    public cameraMinPolarAngle: number = Math.PI * 0.1;  // Límite inferior de la cámara
    public cameraMaxPolarAngle: number = Math.PI * 0.15; // Límite superior de la cámara (reducido significativamente, aprox. 27 grados)
    
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
            cameraRotationSpeed: this.cameraRotationSpeed,
            cameraMinPolarAngle: this.cameraMinPolarAngle,
            cameraMaxPolarAngle: this.cameraMaxPolarAngle
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
                this.cameraRotationSpeed = settings.cameraRotationSpeed ?? 0.5;
                this.cameraMinPolarAngle = settings.cameraMinPolarAngle ?? Math.PI * 0.1;
                this.cameraMaxPolarAngle = settings.cameraMaxPolarAngle ?? Math.PI * 0.15;
            } catch (e) {
                console.error('Error loading settings:', e);
                // If there's an error, use defaults
            }
        }
    }
} 