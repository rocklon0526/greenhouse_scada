import yaml
import trimesh
import numpy as np
import os
import sys

def load_config(config_path):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def create_scene(config):
    scene = trimesh.Scene()
    
    layout = config.get('layout', {})
    zones = layout.get('zones', {})

    # Nutrient Zone
    nutrient = zones.get('nutrient', {})
    nutrient_pos = np.array(nutrient.get('position', [0, 0, 0]))
    
    # Hoppers
    for hopper in nutrient.get('hoppers', []):
        # Create a cone (cylinder with top radius 0)
        # Trimesh cone is height, radius
        mesh = trimesh.creation.cone(radius=2, height=4, sections=32)
        
        # Rotate to point down (default points up Z)
        # We want it to look like a funnel
        rot = trimesh.transformations.rotation_matrix(np.pi, [1, 0, 0])
        mesh.apply_transform(rot)
        
        # Position
        pos = np.array(hopper.get('position', [0, 0, 0]))
        # Add zone offset
        final_pos = nutrient_pos + pos
        
        # Transform
        transform = trimesh.transformations.translation_matrix(final_pos)
        
        # Add to scene with name
        scene.add_geometry(mesh, node_name=hopper['id'], transform=transform)
        print(f"Added Hopper: {hopper['id']} at {final_pos}")

    # Mixing Tank
    mixer = nutrient.get('mixing_tank')
    if mixer:
        mesh = trimesh.creation.cylinder(radius=4, height=6, sections=32)
        pos = np.array(mixer.get('position', [0, 0, 0]))
        final_pos = nutrient_pos + pos
        transform = trimesh.transformations.translation_matrix(final_pos)
        scene.add_geometry(mesh, node_name=mixer['id'], transform=transform)
        print(f"Added Mixer: {mixer['id']} at {final_pos}")

    # Infrastructure (Pipes & Valves)
    infra = nutrient.get('infrastructure', {})
    
    # Pipes
    for pipe in infra.get('pipes', []):
        start = np.array(pipe.get('start', [0,0,0]))
        end = np.array(pipe.get('end', [0,1,0]))
        radius = pipe.get('radius', 0.5)
        
        # Create cylinder between two points
        # Trimesh doesn't have a direct 'cylinder between points' but we can create one and transform it
        # Or use creation.cylinder and rotate/translate
        
        vec = end - start
        length = np.linalg.norm(vec)
        if length > 0:
            midpoint = (start + end) / 2
            
            # Create cylinder along Z axis (default)
            mesh = trimesh.creation.cylinder(radius=radius, height=length, sections=16)
            
            # Rotation to align Z axis with vec
            # default direction is [0, 0, 1]
            direction = vec / length
            
            # Rotation matrix from [0,0,1] to direction
            # Using trimesh.geometry.align_vectors
            rot = trimesh.geometry.align_vectors([0, 0, 1], direction)
            
            # Apply rotation
            mesh.apply_transform(rot)
            
            # Translate to midpoint
            final_pos = nutrient_pos + midpoint
            trans = trimesh.transformations.translation_matrix(final_pos)
            
            # Apply translation (mesh is already rotated around 0,0,0)
            # So we just translate it to the final position
            # Wait, apply_transform modifies the mesh in place. 
            # So we need to translate it *after* rotation.
            # But we already applied rotation. So now we just translate.
            mesh.apply_transform(trans)
            
            scene.add_geometry(mesh, node_name=pipe['id'])
            print(f"Added Pipe: {pipe['id']}")

    # Valves
    for valve in infra.get('valves', []):
        size = valve.get('size', [1, 1, 1])
        mesh = trimesh.creation.box(extents=size)
        pos = np.array(valve.get('position', [0, 0, 0]))
        final_pos = nutrient_pos + pos
        transform = trimesh.transformations.translation_matrix(final_pos)
        scene.add_geometry(mesh, node_name=valve['id'], transform=transform)
        print(f"Added Valve: {valve['id']}")

    # Growing Zone
    growing = zones.get('growing', {})
    growing_pos = np.array(growing.get('position', [0, 0, 0]))

    # Racks
    for rack in growing.get('racks', []):
        size = rack.get('size', [4, 10, 20])
        mesh = trimesh.creation.box(extents=size)
        pos = np.array(rack.get('position', [0, 0, 0]))
        final_pos = growing_pos + pos
        # Adjust so bottom is at 0 (box center is at 0,0,0 by default)
        final_pos[1] += size[1] / 2
        
        transform = trimesh.transformations.translation_matrix(final_pos)
        scene.add_geometry(mesh, node_name=rack['id'], transform=transform)
        print(f"Added Rack: {rack['id']} at {final_pos}")

    # Fans
    for fan in growing.get('fans', []):
        mesh = trimesh.creation.cylinder(radius=2, height=1, sections=32)
        # Rotate to face direction (default Z up, we want Y up but facing X or Z)
        # Config has rotation [0, 0, 1.57] which is 90 deg around Z
        base_rot = trimesh.transformations.rotation_matrix(np.pi/2, [0, 0, 1])
        mesh.apply_transform(base_rot)
        
        pos = np.array(fan.get('position', [0, 0, 0]))
        final_pos = growing_pos + pos
        transform = trimesh.transformations.translation_matrix(final_pos)
        scene.add_geometry(mesh, node_name=fan['id'], transform=transform)
        print(f"Added Fan: {fan['id']} at {final_pos}")

    # Water Walls
    for ww in growing.get('water_walls', []):
        mesh = trimesh.creation.box(extents=[2, 8, 15])
        pos = np.array(ww.get('position', [0, 0, 0]))
        final_pos = growing_pos + pos
        transform = trimesh.transformations.translation_matrix(final_pos)
        scene.add_geometry(mesh, node_name=ww['id'], transform=transform)
        print(f"Added Water Wall: {ww['id']} at {final_pos}")

    # Sensors
    for sensor in growing.get('sensors', []):
        mesh = trimesh.creation.box(extents=[0.5, 0.5, 0.5])
        pos = np.array(sensor.get('position', [0, 0, 0]))
        final_pos = growing_pos + pos
        transform = trimesh.transformations.translation_matrix(final_pos)
        scene.add_geometry(mesh, node_name=sensor['id'], transform=transform)
        # print(f"Added Sensor: {sensor['id']}") # Too many to print

    return scene

if __name__ == "__main__":
    # Paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # projects/greenhouse
    config_path = os.path.join(base_dir, "config", "config.yaml")
    output_path = os.path.join(base_dir, "assets", "greenhouse.glb")

    print(f"Reading config from: {config_path}")
    config = load_config(config_path)
    
    print("Generating scene...")
    scene = create_scene(config)
    
    print(f"Exporting to: {output_path}")
    scene.export(output_path)
    print("Done!")
