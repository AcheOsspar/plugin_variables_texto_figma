figma.showUI(__html__, { width: 320, height: 450 });

let variableMap = {};
let nodeMap = {};

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-variable-node') {
    const { name, value } = msg.payload;

    if (!name || !value) {
      figma.notify("Debes ingresar un nombre y un valor.");
      return;
    }

    variableMap[name] = value;

    // Definir fuente a usar: primero intenta fuente del nodo seleccionado, sino fallback
    let fontToUse = { family: "Inter", style: "Regular" };
    const selection = figma.currentPage.selection;
    if (selection.length > 0 && selection[0].type === "TEXT") {
      fontToUse = selection[0].fontName;
    }

    try {
      await figma.loadFontAsync(fontToUse);

      const textNode = figma.createText();
      textNode.fontName = fontToUse;
      textNode.characters = `{{${name}}}`;
      textNode.x = figma.viewport.center.x;
      textNode.y = figma.viewport.center.y;
      figma.currentPage.appendChild(textNode);
      figma.currentPage.selection = [textNode];
      figma.viewport.scrollAndZoomIntoView([textNode]);

      if (!nodeMap[name]) nodeMap[name] = [];
      nodeMap[name].push(textNode.id);

      figma.ui.postMessage({ type: 'update-list', variables: variableMap });
      figma.notify(`Nodo creado con variable: "${name}"`);

    } catch (e) {
      figma.notify("Error al cargar la fuente. Asegúrate que esté disponible.");
      console.error(e);
    }
  }

  if (msg.type === 'update-values') {
    const updates = msg.payload;
    for (const [name, value] of Object.entries(updates)) {
      variableMap[name] = value;
      const nodeIds = nodeMap[name] || [];
      for (const id of nodeIds) {
        const node = figma.getNodeById(id);
        if (node && node.type === "TEXT") {
          await figma.loadFontAsync(node.fontName);
          node.characters = value;
        }
      }
    }
    figma.notify("Variables actualizadas");
  }
};
