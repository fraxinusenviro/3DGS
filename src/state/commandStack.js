export class CommandStack {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  execute(command) {
    command.do();
    this.undoStack.push(command);
    this.redoStack = [];
  }

  undo() {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this.redoStack.push(cmd);
  }

  redo() {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    cmd.do();
    this.undoStack.push(cmd);
  }
}
