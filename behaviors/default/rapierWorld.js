


class RapierWorldActor {
    static types() {
        if (!Worldcore.RAPIER) return {};
        return {
            "RAPIER.World": {
                cls: Worldcore.RAPIER.World,
                write: world => world.takeSnapshot(),
                read:  snapshot => Worldcore.RAPIER.World.restoreSnapshot(snapshot)
            },
            "RAPIER.EventQueue": {
                cls: Worldcore.RAPIER.EventQueue,
                write: q => {},
                read:  q => new Worldcore.RAPIER.EventQueue(true)
            },
        };
    }

    setup(options = {}) {
        if (options.useCollisionEventQueue) {
            this.queue = new Worldcore.RAPIER.EventQueue(true);
        }

        const gravity = options.gravity || [0.0, -9.8, 0.0];
        const timeStep = 60; // options.timeStep || 50; // In ms

        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> World created.");
        const g = new Worldcore.RAPIER.Vector3(...gravity);
        this.world = new Worldcore.RAPIER.World(g);
        window.rapierPhysicsManager = this;

        this.timeStep = timeStep;
        this.world.timestep = this.timeStep / 1000;
        this.rigidBodies = [];
        this.future(0).tick();
    }

    getThis() {
        return window.rapierPhysicsManager; // this;
    }

    getTrue() {
        return true;
    }

    destroy() {
        super.destroy();
        this.world.free();
        this.world = null;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    tick() {
        if (!this.isPaused) {
            this.world.step(this.queue); // may be undefined
            this.world.forEachActiveRigidBody(rbh => {
                const rb = this.rigidBodies[rbh.handle];
                const t = rb.rigidBody.translation();
                const r = rb.rigidBody.rotation();

                const v = [t.x, t.y, t.z];
                const q = [r.x, r.y, r.z, r.w];

                rb.moveTo(v);
                rb.say("translating", v);
                rb.rotateTo(q);
            });
            if (this.queue) {
                if (this.collisionEventHandler) {
                    queue.drainCollisionEvents((handle1, handle2, started) => {
                        let rb1 = this.rigidBodies[handle1];
                        let rb2 = this.rigidBodies[handle2];
                        this.collisionEventHandler.collisionEvent(rb1, rb2, started);
                    });
                }
            }
        }
        this.future(this.timeStep).tick();
    }

    registerCollisionEventHandler(handler) {
        this.collisionEventHandler = handler;
    }
}

class RapierWorldPawn {
    setup() {
        let material = new Worldcore.THREE.LineBasicMaterial({
            color: 0xffffff,
            vertexColors: Worldcore.THREE.VertexColors
        });
        let geometry =  new Worldcore.THREE.BufferGeometry();
        this.lines = new Worldcore.THREE.LineSegments(geometry, material);
        this.shape.add(this.lines);
        this.shape.frustumCulled = false;
        this.future(0).tick();
    }
    tick() {

        if (!!window.rapierPhysicsManager.world) {
            let buffers = window.rapierPhysicsManager.world.debugRender();
            this.lines.geometry.setAttribute('position', new Worldcore.THREE.BufferAttribute(buffers.vertices, 3));
            this.lines.geometry.setAttribute('color', new Worldcore.THREE.BufferAttribute(buffers.colors, 4));
            this.future(16.0).tick();
        }
    }
}

export default {
    modules: [
        {
            name: "RapierWorld",
            actorBehaviors: [RapierWorldActor],
            pawnBehaviors: [RapierWorldPawn]
        }
    ]
}

/* globals Worldcore */
