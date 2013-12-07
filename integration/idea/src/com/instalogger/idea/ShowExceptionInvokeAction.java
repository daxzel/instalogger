package com.instalogger.idea;

import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.LogicalPosition;
import com.intellij.openapi.editor.ScrollType;
import com.intellij.openapi.fileEditor.FileEditorManager;
import com.intellij.openapi.fileEditor.OpenFileDescriptor;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.openapi.wm.WindowManager;
import com.intellij.psi.PsiFile;
import com.intellij.psi.search.FilenameIndex;
import com.intellij.psi.search.ProjectScope;

import java.awt.*;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 07/12/13
 * Time: 14:07
 * To change this template use File | Settings | File Templates.
 */

class ShowExceptionInvokeAction implements Runnable {
    protected Project project;
    protected String name;
    protected int line;

    ShowExceptionInvokeAction(Project project, String name, int line) {
        this.project = project;
        this.name = name;
        this.line = line;
    }

    public void run() {
        String fileName = name.substring(name.lastIndexOf("/") + 1);
        PsiFile[] files = FilenameIndex.getFilesByName(project, fileName, ProjectScope.getAllScope(project));

        if (files.length > 0) {
            for (PsiFile file : files) {
                VirtualFile vFile = file.getVirtualFile();
                if (vFile != null && vFile.getPath().endsWith(name)) {
                    OpenFileDescriptor desc = new OpenFileDescriptor(project, vFile, line - 1, 0);
                    Editor editor = FileEditorManager.getInstance(project).openTextEditor(desc, true);
                    if (editor != null) {
                        LogicalPosition position = new LogicalPosition(line - 1, 0);
                        editor.getCaretModel().moveToLogicalPosition(position);
                        editor.getScrollingModel().scrollTo(position, ScrollType.CENTER);
                    }
                    final Window window = WindowManager.getInstance().suggestParentWindow(project);
                    if (window != null) {
                        window.setVisible(true);
                    }
                    break;
                }
            }
        }
    }
}