// 云函数类型声明
export interface FunctionContext {
  body: any;
  query: any;
  headers: any;
  method: string;
  path: string;
}

declare module '@lafjs/cloud' {
  interface Database {
    collection(name: string): Collection;
  }

  interface Collection {
    where(conditions: any): Query;
    add(data: any): Promise<any>;
    doc(id: string): Document;
    count(): Promise<{ total: number }>;
  }

  interface Query {
    where(conditions: any): Query;
    field(fields: any): Query;
    orderBy(field: string, direction?: 'asc' | 'desc'): Query;
    skip(num: number): Query;
    limit(num: number): Query;
    get(): Promise<{ data: any[] }>;
    count(): Promise<{ total: number }>;
  }

  interface Document {
    get(): Promise<{ data: any }>;
    update(data: any): Promise<any>;
    remove(): Promise<any>;
  }

  interface CloudModule {
    database(): Database;
    command: {
      neq(value: any): any;
      eq(value: any): any;
      gt(value: any): any;
      gte(value: any): any;
      lt(value: any): any;
      lte(value: any): any;
      in(array: any[]): any;
      nin(array: any[]): any;
    };
  }

  const cloud: CloudModule;
  export default cloud;
}
