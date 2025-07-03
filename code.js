figma.showUI(__html__, { width: 320, height: 450 });

let variableMap = {}; // { nombreVariable: valor }
let nodeMap = {};     // { nombreVariable: [nodeId, ...] }

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'assign-variable') {
    const { name, value } = msg.payload;
    variableMap[name] = value;

    const selectedNodes = figma.currentPage.selection.filter(n => n.type === "TEXT");

    for (const node of selectedNodes) {
      await figma.loadFontAsync(node.fontName);
      node.characters = `{{${name}}}`;
      nodeMap[name] = nodeMap[name] || [];
      if (!nodeMap[name].includes(node.id)) {
        nodeMap[name].push(node.id);
      }
    }

    figma.notify(`Variable "${name}" asignada a ${selectedNodes.length} nodo(s).`);
    figma.ui.postMessage({ type: 'update-list', variables: variableMap });
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