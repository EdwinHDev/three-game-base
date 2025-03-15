import { Group, AnimationClip } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export class ModelLoader {
    private static fbxLoader = new FBXLoader();

    static async loadModel(url: string): Promise<Group> {
        try {
            const model = await this.fbxLoader.loadAsync(url);
            // Ajustar la escala del modelo FBX (los modelos de Mixamo suelen necesitar esto)
            model.scale.setScalar(0.01);
            return model;
        } catch (error) {
            console.error('Error loading FBX model:', error);
            throw error;
        }
    }

    static async loadAnimations(urls: string[]): Promise<AnimationClip[]> {
        const animations: AnimationClip[] = [];

        for (const url of urls) {
            try {
                const fbx = await this.fbxLoader.loadAsync(url);
                if (fbx.animations.length > 0) {
                    // Obtener el nombre base del archivo para nombrar la animación
                    const fileName = url.split('/').pop()?.split('.')[0] || '';
                    const animation = fbx.animations[0];
                    animation.name = fileName; // Usar el nombre del archivo como nombre de la animación
                    animations.push(animation);
                } else {
                    console.warn(`No animations found in ${url}`);
                }
            } catch (error) {
                console.warn(`Error loading animation from ${url}:`, error);
            }
        }

        return animations;
    }
} 