class PendulumActor {
    setup() {
        let d = 10;
        this.removeObjects();
        this.links = [...Array(d).keys()].map((i) => {
            let bodyDesc;
            if (i === 0) {
                bodyDesc = Worldcore.RAPIER.RigidBodyDesc.kinematicPositionBased();
            } else {
                bodyDesc = Worldcore.RAPIER.RigidBodyDesc.dynamic();
            }

            let card;
            let translation = [0, 0 - i * 2, 0];
            let name = `link${i}`;
            let cd;

            if (i === d - 1) {
                card = this.createCard({
                    type: "3d",
                    dataLocation: "3_EGjDfsBvE93taoFG1Uq6hS6MtH_JMHT33IaSwpij0gR1tbX1wVAABJRkNKXAFaXAFMXUBeWkpbAUZAAFoAaEt5TVZDZlxuRH5MbXdLHGhXTllWWHpkeHZ2HQBGQAFMXUBeWkpbAUJGTF1AWUpdXEoATHBmAldHRFZ5Wn9NYnpJSktgZVpESmRBRHt2YW1fYnV4W3gZXh1iRGQeegBLTltOAF1ment6SR0dQGhFHhhZfE1KYxdeGm12d1dCVUldf3pYaEoWRFoaSVlZF2I",
                    modelType: "glb",
                    translation,
                    name,
                    parent: this,
                    pendulumProto: true,
                    pendulumHandlesEvent: true,
                    behaviorModules: ["Rapier", "PendulumLink"],
                    noSave: true,
                });

                card.call("Rapier$RapierActor", "createRigidBody", bodyDesc);
                cd = Worldcore.RAPIER.ColliderDesc.ball(0.85);
            } else {
                card = this.createCard({
                    type: "object",
                    translation,
                    name,
                    color: this._cardData.color,
                    parent: this,
                    pendulumHandlesEvent: true,
                    behaviorModules: ["Rapier", "PendulumLink"],
                    noSave: true,
                });

                card.call("Rapier$RapierActor", "createRigidBody", bodyDesc);
                cd = Worldcore.RAPIER.ColliderDesc.cylinder(0.9, 0.4);
            }


            cd.setRestitution(0.5);
            cd.setFriction(1);

            if (i === d - 1) {
                cd.setDensity(4.0); // 10);
            } else {
                cd.setDensity(1.5);
            }

            card.call("Rapier$RapierActor", "createCollider", cd);
            return card;
        });

        this.joints = [...Array(d - 1).keys()].map((i) => {
            let card = this.createCard({
                type: "object",
                name: `joint${i}`,
                parent: this,
                behaviorModules: ["Rapier"],
                noSave: true,
            });
            card.call(
                "Rapier$RapierActor", "createImpulseJoint", "spherical", this.links[i], this.links[i + 1],
                {x: 0, y: -1, z: 0}, {x: 0, y: 1, z: 0}
            );
            return card;
        });

        this.jointProto = this.createCard({
            type: "object",
            name,
            pendulumProto: true,
            parent: this,
            behaviorModules: ["PendulumLink"],
        });
    }

    removeObjects() {
        if (this.links) {
            this.links.forEach(l => l.destroy());
            this.links = null;
        }
        if (this.joints) {
            this.joints.forEach(j => j.destroy());
            this.joints = null;
        }
    }
}

class PendulumPawn {
    setup() {
        if (this.obj) {
            this.shape.children.forEach((o) => this.shape.remove(o));
            this.shape.children = [];
            this.obj.dispose();
            this.obj = null;
        }

        let geometry = new Worldcore.THREE.BoxGeometry(0.5, 0.5, 0.5);
        let material = new Worldcore.THREE.MeshStandardMaterial({color: this.actor._cardData.color || 0xee8888});
        this.obj = new Worldcore.THREE.Mesh(geometry, material);
        this.obj.castShadow = this.actor._cardData.shadow;
        this.obj.receiveShadow = this.actor._cardData.shadow;

        this.shape.add(this.obj);

        this.removeEventListener("pointerDoubleDown", "onPointerDoubleDown");
        this.addEventListener("pointerDoubleDown", "nop");
    }
}

class PendulumLinkActor {
    setup() {
        if (this._cardData.pendulumHandlesEvent) {
            this.addEventListener("pointerTap", "jolt");
        }
    }

    jolt(p3d) {
        // Apply an upward force and random spin.
        if (!p3d.normal) {return;}
        let r = this.rigidBody;
        if (!r) {return;}

        let jolt = Worldcore.v3_scale(p3d.normal, -40);
        r.applyImpulse({x: jolt[0], y: jolt[1], z: jolt[2]}, true);
    }

    teardown() {
        this.removeEventListener("pointerTap", "jolt");
    }
}

class PendulumLinkPawn {
    setup() {
        /*
          Creates a Three.JS mesh based on the specified rapierShape and rapierSize.

          For a demo purpose, it does not override an existing shape
          (by checking this.shape.children.length) so that the earth
          shape created by FlightTracker behavior is preserved.

          Uncomment the cyclinder case to add the cylinder shape.

        */
        this.removeEventListener("pointerDoubleDown", "onPointerDoubleDown");
        this.addEventListener("pointerDoubleDown", "nop");

        if (this.actor._cardData.pendulumProto) {return;}
        this.shape.children.forEach((c) => this.shape.remove(c));
        this.shape.children = [];

        let s = [0.1, 2.3];
        let geometry = new Worldcore.THREE.CylinderGeometry(s[0], s[0], s[1], 20);
        let material = new Worldcore.THREE.MeshStandardMaterial({color: this.actor._cardData.color || 0xcccccc, metalness: 0.6});
        this.obj = new Worldcore.THREE.Mesh(geometry, material);
        this.obj.castShadow = this.actor._cardData.shadow;
        this.obj.receiveShadow = this.actor._cardData.shadow;

        this.shape.add(this.obj);
    }
}

export default {
    modules: [
        {
            name: "Pendulum",
            actorBehaviors: [PendulumActor],
            pawnBehaviors: [PendulumPawn]
        },
        {
            name: "PendulumLink",
            actorBehaviors: [PendulumLinkActor],
            pawnBehaviors: [PendulumLinkPawn]
        }
    ]
}

/* globals Worldcore */
