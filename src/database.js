const { deleteApp, initializeApp } = require("firebase/app");
const {
	createUserWithEmailAndPassword,
	fetchSignInMethodsForEmail,
	getAuth,
	signInAnonymously,
	signInWithEmailAndPassword,
	signOut,
} = require("firebase/auth");
const { getDatabase } = require("firebase/database");

module.exports = function (RED) {
	function DatabaseNode(config) {
		RED.nodes.createNode(this, config);

		const node = this;
		this.nodes = [];

		const app = initializeApp({
			apiKey: this.credentials.apiKey,
			databaseURL: this.credentials.url,
		});

		const auth = getAuth(app);

		function setNodesConnected() {
			for (const n of node.nodes) {
				n.status({ fill: "green", shape: "dot", text: "connected" });
			}
		}

		function setNodesDisconnected() {
			for (const n of node.nodes) {
				n.status({ fill: "red", shape: "dot", text: "disconnected" });
			}
		}

		try {
			// TODO: Add other authentication methods
			switch (config.authType) {
				case "anonymous":
					signInAnonymously(auth).then(() => setNodesConnected());
					break;
				case "email":
					// Checks if the user already has an account otherwise it creates one
					fetchSignInMethodsForEmail(auth, this.credentials.email).then((method) => {
						if (method.length === 0) {
							createUserWithEmailAndPassword(auth, this.credentials.email, this.credentials.password);
						} else if (method.includes("password")) {
							// NOTE: Fails with an error if the email address and password do not match!
							signInWithEmailAndPassword(auth, this.credentials.email, this.credentials.password).then(() =>
								setNodesConnected()
							);
						}
						//else if (method.includes("link")) {}
					});
					break;
			}
		} catch (error) {
			node.error(error);
			setNodesDisconnected();
		}

		this.app = app;
		this.auth = auth;
		this.db = getDatabase(app);

		node.on("close", function (done) {
			if (!node.app) {
				done();
				return;
			}

			signOut(node.auth)
				.then(() => deleteApp(node.app).then(() => done()))
				.catch((error) => done(error));
		});
	}

	RED.nodes.registerType("database-config", DatabaseNode, {
		credentials: {
			apiKey: { type: "text" },
			email: { type: "text" },
			json: { type: "password" },
			password: { type: "password" },
			secret: { type: "password" },
			url: { type: "text" },
		},
	});
};
