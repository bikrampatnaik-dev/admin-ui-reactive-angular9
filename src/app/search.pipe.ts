import { Pipe, PipeTransform } from "@angular/core";
@Pipe({
  name: "customerEmailFilter",
})
export class SearchPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    if (!args) {
      return value;
    }
    return value.filter((val) => {
      debugger;
      if (val) {
        let rVal =
          val.controls.name.value
            .toLocaleLowerCase()
            .includes(args.toLocaleLowerCase()) ||
          val.controls.email.value
            .toLocaleLowerCase()
            .includes(args.toLocaleLowerCase()) ||
          val.controls.role.value
            .toLocaleLowerCase()
            .includes(args.toLocaleLowerCase());
        return rVal;
      }
    });
  }
}
