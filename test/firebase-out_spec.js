const database = require("../src/database");
const helper = require("node-red-node-test-helper");
const flow = [
	{ id: "database", type: "database-config", name: "My Database", authType: "anonymous" },
	{ id: "h1", type: "helper" },
];

// TODO: Add more tests
describe("Firebase OUT Node", function () {
	const firebase = require("../src/firebase-out");

	before(function (done) {
		helper.startServer(done);
	});

	after(function (done) {
		helper.stopServer(done);
	});

	afterEach(function () {
		helper.unload();
	});

	context("When NODE is loaded", () => {
		it("should be loaded", function (done) {
			const newFlow = [{ id: "firebase", type: "firebase-out", name: "test/stream", database: "database" }, ...flow];

			helper.load([firebase, database], newFlow, function () {
				try {
					const n1 = helper.getNode("firebase");
					const n2 = helper.getNode("database");
					n1.should.have.property("name", "test/stream");
					n1.should.have.property("type", "firebase-out");
					n1.database.should.be.Object();
					n1.database.nodes.should.have.length(1);
					n2.should.have.property("name", "My Database");
					n2.should.have.property("type", "database-config");
					done();
				} catch (error) {
					done(error);
				}
			});
		});

		it("should throw an error without database configured", function (done) {
			const newFlow = [{ id: "firebase", type: "firebase-out", database: null }, ...flow];

			helper.load([firebase, database], newFlow, function () {
				try {
					const logEvents = helper.log().args.filter(function (evt) {
						return evt[0].type == "firebase-out";
					});
					logEvents.should.have.length(1);
					logEvents[0][0].should.have.property("msg", "Database not configured!");
					done();
				} catch (error) {
					done(error);
				}
			});
		});
	});

	context("When PATH is configured in the node", () => {
		it("should throw an error with bad type", function (done) {
			const newFlow = [
				{ id: "firebase", type: "firebase-out", database: "database", path: 123, pathType: "str" },
				...flow,
			];

			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.receive({ payload: "" });

				setTimeout(function () {
					try {
						const logEvents = helper.log().args.filter(function (evt) {
							return evt[0].type == "firebase-out";
						});
						logEvents.should.have.length(1);
						logEvents[0][0].should.have.property("msg", new Error("PATH must be a string!"));
						done();
					} catch (error) {
						done(error);
					}
				}, 50);
			});
		});

		it("should throw an error with bad characters", function (done) {
			const newFlow = [
				{ id: "firebase", type: "firebase-out", database: "database", path: "test.", pathType: "str" },
				...flow,
			];

			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.receive({ payload: "" });

				setTimeout(function () {
					try {
						const logEvents = helper.log().args.filter(function (evt) {
							return evt[0].type == "firebase-out";
						});
						logEvents.should.have.length(1);
						logEvents[0][0].should.have.property("msg", new Error('PATH must not contain ".", "#", "$", "[", or "]"'));
						done();
					} catch (error) {
						done(error);
					}
				}, 50);
			});
		});

		it("should throw an error with empty field", function (done) {
			const newFlow = [
				{ id: "firebase", type: "firebase-out", database: "database", path: "", pathType: "str" },
				...flow,
			];

			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.receive({ payload: "" });

				setTimeout(function () {
					try {
						const logEvents = helper.log().args.filter(function (evt) {
							return evt[0].type == "firebase-out";
						});
						logEvents.should.have.length(1);
						logEvents[0][0].should.have.property("msg", new Error("PATH must be non-empty string!"));
						done();
					} catch (error) {
						done(error);
					}
				}, 50);
			});
		});
	});

	context("When PATH is configured dynamically", () => {
		it("should throw an error with bad type", function (done) {
			const newFlow = [
				{ id: "firebase", type: "firebase-out", database: "database", path: "topic", pathType: "msg" },
				...flow,
			];

			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.receive({ payload: "", topic: 123 });

				setTimeout(function () {
					try {
						const logEvents = helper.log().args.filter(function (evt) {
							return evt[0].type == "firebase-out";
						});
						logEvents.should.have.length(1);
						logEvents[0][0].should.have.property("msg", new Error("PATH must be a string!"));
						done();
					} catch (error) {
						done(error);
					}
				}, 50);
			});
		});

		it("should throw an error with bad characters", function (done) {
			const newFlow = [
				{ id: "firebase", type: "firebase-out", database: "database", path: "topic", pathType: "msg" },
				...flow,
			];

			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.receive({ payload: "", topic: "test." });

				setTimeout(function () {
					try {
						const logEvents = helper.log().args.filter(function (evt) {
							return evt[0].type == "firebase-out";
						});
						logEvents.should.have.length(1);
						logEvents[0][0].should.have.property("msg", new Error('PATH must not contain ".", "#", "$", "[", or "]"'));
						done();
					} catch (error) {
						done(error);
					}
				}, 50);
			});
		});

		it("should throw an error with empty field", function (done) {
			const newFlow = [
				{ id: "firebase", type: "firebase-out", database: "database", path: "topic", pathType: "msg" },
				...flow,
			];

			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.receive({ payload: "", topic: "" });

				setTimeout(function () {
					try {
						const logEvents = helper.log().args.filter(function (evt) {
							return evt[0].type == "firebase-out";
						});
						logEvents.should.have.length(1);
						logEvents[0][0].should.have.property("msg", new Error("PATH must be non-empty string!"));
						done();
					} catch (error) {
						done(error);
					}
				}, 50);
			});
		});

		it("should throw an error with undefined msg", function (done) {
			const newFlow = [
				{ id: "firebase", type: "firebase-out", database: "database", path: "badTopic", pathType: "msg" },
				...flow,
			];

			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.receive({ payload: "", topic: "" });

				setTimeout(function () {
					try {
						const logEvents = helper.log().args.filter(function (evt) {
							return evt[0].type == "firebase-out";
						});
						logEvents.should.have.length(1);
						logEvents[0][0].should.have.property("msg", new Error("The msg containing the PATH do not exist!"));
						done();
					} catch (error) {
						done(error);
					}
				}, 50);
			});
		});
	});

	context("When QUERY is configured", () => {
		const newFlow = [
			{ id: "firebase", type: "firebase-out", database: "database", path: "test", pathType: "str", queryType: "none" },
			...flow,
		];

		it("should throw an error with bad type", function (done) {
			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.receive({ payload: "", method: 123 });

				setTimeout(function () {
					try {
						const logEvents = helper.log().args.filter(function (evt) {
							return evt[0].type == "firebase-out";
						});
						logEvents.should.have.length(1);
						logEvents[0][0].should.have.property("msg", new Error("msg.method must be a string!"));
						done();
					} catch (error) {
						done(error);
					}
				}, 50);
			});
		});

		it("should throw an error with bad query", function (done) {
			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.receive({ payload: "", method: "badQuery" });

				setTimeout(function () {
					try {
						const logEvents = helper.log().args.filter(function (evt) {
							return evt[0].type == "firebase-out";
						});
						logEvents.should.have.length(1);
						logEvents[0][0].should.have.property("msg");
						done();
					} catch (error) {
						done(error);
					}
				}, 50);
			});
		});

		it("should throw an error with undefined msg", function (done) {
			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.receive({ payload: "" });

				setTimeout(function () {
					try {
						const logEvents = helper.log().args.filter(function (evt) {
							return evt[0].type == "firebase-out";
						});
						logEvents.should.have.length(1);
						logEvents[0][0].should.have.property("msg", new Error("msg.method do not exist!"));
						done();
					} catch (error) {
						done(error);
					}
				}, 50);
			});
		});
	});

	context("When NODE is removed/redeployed", () => {
		it("should remove node status", function (done) {
			const newFlow = [{ id: "firebase", type: "firebase-out", database: "database" }, ...flow];

			helper.load([firebase, database], newFlow, function () {
				const n1 = helper.getNode("firebase");

				n1.close(true)
					.then(() => {
						n1.database.nodes.should.have.length(0);
						done();
					})
					.catch((error) => done(error));
			});
		});
	});
});
