import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { map, startWith } from "rxjs/operators";
import { AppService } from "../app.service";

interface ITableRow {
  id: string;
  isChecked?: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: "app-tables",
  templateUrl: "./tables.component.html",
  styleUrls: ["./tables.component.scss"],
})
export class TablesComponent implements OnInit {
  itemsPerPage: number = 10;
  searchModel: string;
  tableName;
  currentPage: number = 1;
  pages: number;
  inited: boolean = false;
  @ViewChild("pagination", { static: true }) pagination: ElementRef;
  @ViewChildren("checkbox") checkbox: QueryList<ElementRef>;

  tableRowData: ITableRow[] = [];
  public invoiceForm: FormGroup;
  isEditable = "enable";
  lastPageCount: number;
  filteredOptions: any;
  constructor(
    private _fb: FormBuilder,
    private _service: AppService,
    private renderer: Renderer2
  ) {}
  ngOnInit() {
    this.getUser();
    this.formsInit();
  }

  /**
   * START
   * REACTIVE FORM iMPLEMENTATION
   * INITALIZING FORMS
   * GETTING API SERIVCE
   */
  getUser() {
    this._service.getUsers().subscribe((res) => {
      this.tableRowData = res.map((obj) => ({ ...obj, isChecked: false }));
      this.formsInit();
      this.paginationInit("pager", this.tableRowData.length);
    });
  }

  get formArr() {
    return this.invoiceForm.get("Rows") as FormArray;
  }

  get fromTo() {
    let from = (this.currentPage - 1) * this.itemsPerPage;
    let to = from + this.itemsPerPage - 1;
    return { from, to };
  }

  get controls() {
    return this.formArr.controls;
  }

  formsInit() {
    this.invoiceForm = this._fb.group({
      search: "",
      isCheckedAll: [false],
      Rows: this._fb.array(
        this.tableRowData.map((contact) => this.initRows(contact))
      ),
    });
  }

  onSearch() {
    this.paginationInit("pager", this.tableRowData.length);
  }

  initRows(fieldName) {
    return this._fb.group({
      id: [fieldName.id],
      isChecked: [fieldName.isChecked],
      name: [{ value: fieldName.name, disabled: true }],
      email: [{ value: fieldName.email, disabled: true }],
      role: [{ value: fieldName.role, disabled: true }],
    });
  }

  deleteRow(index: number) {
    this.formArr.removeAt(index);
    this.tableRowData.splice(index, 1);
    this.paginationInit("pager", this.tableRowData.length);
  }

  deleteAllRow() {
    this.controls.map((value, i) => {
      let checkboxEle = value;
      if (checkboxEle && checkboxEle.get("isChecked").value) {
        let id = JSON.parse(checkboxEle.get("id").value);
        this.rows[i].style.display = "none";
        this.tableRowData.splice(
          this.tableRowData.findIndex((obj) => obj.id == id),
          1
        );
      }
    });
    this.formsInit();
    this.currentPage = 1;
    this.paginationInit("pager", this.tableRowData.length);
  }

  enableEditRow(index: number, action: string) {
    this.isEditable = action;
    this.controls[index].get("name")[this.isEditable]();
    this.controls[index].get("email")[this.isEditable]();
    this.controls[index].get("role")[this.isEditable]();
  }

  toggleAllCheckbox() {
    const isCheckAll = !this.invoiceForm.controls.isCheckedAll.value;
    for (let i = this.fromTo.from; i <= this.fromTo.to; i++) {
      if (this.controls[i]) {
        this.controls[i]["controls"].isChecked.setValue(isCheckAll);
      }
      this.highlightRow(isCheckAll, i);
    }
  }

  toggleCheck(i, evt) {
    let event: boolean = evt;
    this.controls[i]["controls"].isChecked.setValue(event);
    this.checkViewPort();
    this.highlightRow(event, i);
  }

  highlightRow(event, i) {
    this.rows[i].style.background = event ? "#dfdfdf" : "";
  }

  checkViewPort() {
    let count = 0;
    for (let i = this.fromTo.from; i <= this.fromTo.to; i++) {
      if (this.controls[i] && this.controls[i].get("isChecked").value) {
        count = count + 1;
      }
    }
    if (count === this.itemsPerPage || count === this.lastPageCount - 1) {
      this.invoiceForm.controls.isCheckedAll.setValue(true);
    } else {
      this.invoiceForm.controls.isCheckedAll.setValue(false);
    }
  }

  /**
   * START
   * @param PaginationInitialization
   * Adding Event Listener to each pagination button
   * Show 10 row in a table
   * PURE JAVASCRIPT
   */
  paginationInit(tableName, length) {
    this.tableName = tableName;
    let records = length + 1;
    this.pages = Math.ceil(records / this.itemsPerPage);
    const dec = Math.abs(this.pages);
    const num = Math.floor(dec);
    const lsC = dec - num;
    this.lastPageCount =
      lsC.toFixed(1).split(".").length > 0
        ? JSON.parse(lsC.toFixed(1).split(".")[1])
        : null;
    this.inited = true;
    this.showPageNav();
    setTimeout(() => this.showPage(1), 0);
  }

  get rows() {
    return document.querySelectorAll<HTMLElement>("#visbileRow");
  }

  showPageNav() {
    if (!this.inited) {
      return;
    }
    let element = this.pagination.nativeElement;

    let pagerHtml = `<span class="pg-normal pg-prev" #prev>«</span> `;
    for (let page = 1; page <= this.pages; page++) {
      pagerHtml += `<span id="pg${page}" class="pg-normal pg-next" #pages>${page}</span> `;
    }
    pagerHtml += `<span class="pg-normal pg-last" #next>»</span></div>`;
    element.innerHTML = pagerHtml;
    this.addEventListener();
  }

  addEventListener() {
    let pageList = this.pagination.nativeElement.querySelectorAll(".pg-next");
    pageList.forEach((element, i) => {
      this.renderer.listen(element, "click", (evt) => {
        this.showPage(JSON.parse(evt.currentTarget.innerHTML));
      });
    });

    this.renderer.listen(
      this.pagination.nativeElement.querySelector(".pg-prev"),
      "click",
      (evt) => {
        if (this.currentPage > 1) {
          this.showPage(this.currentPage - 1);
        }
      }
    );
    this.renderer.listen(
      this.pagination.nativeElement.querySelector(".pg-last"),
      "click",
      (evt) => {
        if (this.currentPage < this.pages) {
          this.showPage(this.currentPage + 1);
        }
      }
    );
  }

  showPage(pageNumber: number) {
    if (!this.inited) {
      return;
    }

    let oldPageAnchor = this.pagination.nativeElement.querySelector(
      `#pg${this.currentPage}`
    );
    oldPageAnchor.className = "pg-normal";

    this.currentPage = pageNumber;
    let newPageAnchor = this.pagination.nativeElement.querySelector(
      `#pg${this.currentPage}`
    );
    newPageAnchor.className = "pg-selected";

    this.showRecords();
    this.checkViewPort();
  }

  showRecords() {
    for (let i = 0; i < this.rows.length; i++) {
      if (i < this.fromTo.from || i > this.fromTo.to) {
        this.rows[i].style.display = "none";
      } else {
        this.rows[i].style.display = "";
      }
    }
  }
}
