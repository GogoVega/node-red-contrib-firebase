"use strict";

const FirebaseQueryConstraintsContainer = (function () {
	const queryConstraintTypes = new Array("endAt", "endBefore", "equalTo", "limitToFirst", "limitToLast", "orderByChild", "orderByKey", "orderByPriority", "orderByValue", "startAfter", "startAt");
	const queryConstraintFieldOptions = queryConstraintTypes.map((fieldName) => (
		{ value: fieldName, label: i18n(`constraint.${fieldName}`) }
	));

	class EditableQueryConstraintsList {
		// TODO: constraint to plural
		constructor() {
			this.containerId = "#node-input-constraints-container";
			this.containerClass = ".node-input-constraints-container-row";
			this.useConstraintsId = "#node-input-useConstraint";
			this.node = {};
		}

		#buildContainer() {
			this.container?.css({ "min-height": "150px", "min-width": "300px" }).editableList({
				addButton: i18n("addConstraint"),
				addItem: addItem,
				removable: true,
				sortable: true,
			});

			this.useConstraints?.on("change", () => this.#constraintsHandler());
		}

		#constraintsHandler() {
			if (this.useConstraints?.prop("checked") === true) {
				const constraints = Object.entries(this.node.constraint || {});

				if (!constraints.length) constraints.push(["limitToLast", 5]);

				constraints.forEach((item) => this.container?.editableList("addItem", item));
				this.containerRow?.show();
			} else {
				this.containerRow?.hide();
				this.container?.editableList("empty");
			}

			RED.tray.resize();
		}

		build(node) {
			this.container = $(this.containerId);
			this.containerRow = $(this.containerClass);
			this.useConstraints = $(this.useConstraintsId);
			this.node = node;
			this.#buildContainer();
		}

		reSize(size) {
			let height = size.height;
			const rows = $(`#dialog-form>div:not(${this.containerClass})`);
			const editorRow = $(`#dialog-form>div${this.containerClass}`);

			for (let i = 0; i < rows.length; i++) {
				height -= $(rows[i]).outerHeight(true) || 0;
			}

			height -= (parseInt(editorRow.css("marginTop")) + parseInt(editorRow.css("marginBottom")));
			height += 16;
			this.container?.editableList("height", height);
		}

		saveItems() {
			const node = this.node;
			this.container?.editableList("items").sort(compareItemsList);

			// TODO: constraint to plural
			this.node.constraint = {};

			this.container?.each(function () {
				const constraintType = $(this).find("#node-input-constraint-type").typedInput("value");
				const value = $(this).find("#node-input-constraint-value").val();
				const child = $(this).find("#node-input-constraint-child").val() || undefined;
				const type = $(this).find("#node-input-constraint-value").typedInput("type");

				switch (constraintType) {
					case "endAt":
					case "endBefore":
					case "equalTo":
					case "startAfter":
					case "startAt": {
						let valueParsed =
							// TODO: Use server timestamp
							type === "date" ? Date.now() :
								type === "null" ? null :
									type === "num" ? Number(value) :
										type === "bool" ? (value === "true" ? true : false) :
											value;

						if (type === "num" && Number.isNaN(valueParsed)) {
							RED.notify("Query Constraints: Setted value is not a number!", "error");
							valueParsed = value;
						}

						node.constraint[constraintType] = { value: valueParsed, key: child, type: type };
						break;
					}
					case "limitToFirst":
					case "limitToLast": {
						let valueParsed = Number(value || NaN);
						if (!Number.isInteger(valueParsed) || valueParsed <= 0) {
							RED.notify("Query Constraints: Setted value is not an integrer > 0!", "error");
							valueParsed = value;
						}

						node.constraint[constraintType] = valueParsed;
						break;
					}
					case "orderByChild":
						if (!isChildValid(child, constraintType)) RED.notify("Query Constraints: Setted value is not a valid child!", "error");
						// TODO: check null => invalid child
						node.constraint[constraintType] = child;
						break;
					case "orderByKey":
					case "orderByPriority":
					case "orderByValue":
						node.constraint[constraintType] = null;
						break;
				}
			});
		}
	}

	function addItem(container, index, data) {
		const inputRows = $("<div></div>", { style: "flex-grow: 1" }).appendTo(container);
		const row = $("<div/>", { style: "width: 45%; vertical-align: top; display: inline-block;" }).appendTo(inputRows);
		const row2 = $("<div/>", { style: "width: calc(54% - 5px); margin-left: 5px; vertical-align: top; display: inline-block;" }).appendTo(inputRows);
		const row3 = $("<div/>", { class: "constraints-container-row-value" }).appendTo(row2);
		const constraintType = $("<input/>", { type: "text", id: "node-input-constraint-type", style: "width: 100%; text-align: center;" }).appendTo(row);
		const valueField = $("<input/>", { type: "text", id: "node-input-constraint-value", style: "width: 100%;", placeholder: i18n("placeholder.value") }).appendTo(row3);
		const childField = $("<input/>", { type: "text", id: "node-input-constraint-child", style: "width: 100%;", placeholder: i18n("placeholder.child") }).appendTo(row2);
		$("<input/>", { type: "hidden", id: "node-input-constraint-valueType" }).appendTo(row3);

		container.css({
			overflow: "auto",
			whiteSpace: "normal",
			display: "flex",
			"align-items": "center",
		});

		valueField.typedInput({ default: "num", typeField: "#node-input-constraint-valueType", types: ["num"] });
		childField
			.typedInput({ default: "str", types: [{ value: "str", label: "string", icon: "red/images/typedInput/az.svg", validate: (child) => isChildValid(child, constraintType.val()) }] })
			.typedInput("hide");

		constraintType
			.on("change", (_event, _type, value) => updateTypeOfTypedInput(valueField, row3, childField, value))
			.typedInput({ types: [{ options: queryConstraintFieldOptions }] })
			.typedInput("value", "orderByValue");

		// if known value (previously defined)
		if (Array.isArray(data)) {
			const [key, value] = data;

			constraintType.typedInput("value", key);

			if (value && typeof value === "object") {
				valueField.typedInput("value", value.value?.toString() ?? "");
				valueField.typedInput("type", value.type ?? "str");
				childField.typedInput("value", value.key ?? "");
			} else {
				if (key === "orderByChild") {
					valueField.typedInput("value", "");
					childField.typedInput("value", value ?? "");
				} else {
					valueField.typedInput("value", value ?? "");
					childField.typedInput("value", "");
				}
			}

			data = {};
			$(container).data("data", data);
		}

		data.index = index;
	}

	function compareItemsList(a, b) {
		return a.index - b.index;
	}

	function i18n(key) {
		return FirebaseUI._(key, "load-config", "query-constraints");
	}

	function isChildValid(child, constraintType) {
		const empty = constraintType !== "orderByChild";
		const regex = empty ? /[\s.#$\[\]]/ : /^$|[\s.#$\[\]]/;
		if (typeof child === "string" && !regex.test(child)) return true;
		return false;
	}

	function isConstraintsValid() {
		return function (constraints, opt) {
			if (typeof constraints !== "object") return false;

			for (const [k, v] of Object.entries(constraints)) {
				switch (k) {
					case "endAt":
					case "endBefore":
					case "equalTo":
					case "startAfter":
					case "startAt": {
						if (typeof v !== "object" || v === null) return false;

						const valueValidation = FirebaseUI.validators.typedInput("constraint-valueType")(v.value, opt);
						if (valueValidation !== true) return valueValidation;

						const keyValidation = FirebaseUI.validators.child(true)(v.key, opt);
						if (keyValidation !== true) return keyValidation;

						if ((v.type === "date" || v.type === "num") && (typeof v.value !== "number" || Number.isNaN(v.value))) return false;
						if (v.type === "bool" && typeof v.value !== "boolean") return false;
						if (v.type === "null" && v.value !== null) return false;
						if (v.type === "str" && typeof v.value !== "string") return false;
						break;
					}
					case "limitToFirst":
					case "limitToLast": {
						const validation = FirebaseUI.validators.priority()(v, opt);
						if (validation !== true) return validation;
						break;
					}
					case "orderByChild": {
						const validation = FirebaseUI.validators.child()(v, opt);
						if (validation !== true) return validation;
						break;
					}
					case "orderByKey":
					case "orderByPriority":
					case "orderByValue":
						if (v !== null) return false;
						break;
					default:
						return false;
				}
			}

			return true;
		}
	}

	function updateTypeOfTypedInput(value, valueContainer, child, key) {
		// Initial state
		value.typedInput("show");
		valueContainer.css("padding-bottom", "0px");
		child.typedInput("hide");
		child.typedInput("value", "");

		switch (key) {
			case "endAt":
			case "endBefore":
			case "equalTo":
			case "startAfter":
			case "startAt":
				value.typedInput("types", ["bool", "num", "str", "date", { value: "null", label: "null", hasValue: false }]);
				valueContainer.css("padding-bottom", "5px");
				child.typedInput("show");
				break;
			case "limitToFirst":
			case "limitToLast":
				value.typedInput("types", ["num"]);
				break;
			case "orderByChild":
				value.typedInput("hide");
				child.typedInput("show");
				break;
			case "orderByKey":
			case "orderByPriority":
			case "orderByValue":
				value.typedInput("hide");
				break;
		}
	}

	return {
		editableConstraintsList: { create: () => new EditableQueryConstraintsList() },
		validators: { isConstraintsValid },
	};
})();