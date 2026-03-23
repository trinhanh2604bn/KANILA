import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionGroup, PermissionAction } from '../../models/permission.model';

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.css'
})
export class PermissionMatrixComponent {
  @Input() groups: PermissionGroup[] = [];
  @Output() groupsChange = new EventEmitter<PermissionGroup[]>();

  toggleSelectAll(group: PermissionGroup) {
    const nextState = !group.isAllSelected;
    group.isAllSelected = nextState;
    group.isIndeterminate = false;
    group.actions.forEach(a => a.selected = nextState);
    this.emitChanges();
  }

  toggleAction(group: PermissionGroup, action: PermissionAction) {
    action.selected = !action.selected;
    
    const selectedCount = group.actions.filter(a => a.selected).length;
    
    if (selectedCount === 0) {
      group.isAllSelected = false;
      group.isIndeterminate = false;
    } else if (selectedCount === group.actions.length) {
      group.isAllSelected = true;
      group.isIndeterminate = false;
    } else {
      group.isAllSelected = false;
      group.isIndeterminate = true; // Indeterminate state check via template bindings
    }
    
    this.emitChanges();
  }

  private emitChanges() {
    this.groupsChange.emit(this.groups);
  }
}
