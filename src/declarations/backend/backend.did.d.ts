import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface FileReference { 'hash' : string, 'path' : string }
export interface Motorcycle {
  'id' : string,
  'model' : string,
  'cylinderCapacity' : bigint,
  'description' : string,
  'brand' : string,
  'price' : bigint,
  'images' : Array<string>,
}
export interface _SERVICE {
  'addMotorcycle' : ActorMethod<[Motorcycle], undefined>,
  'deleteMotorcycle' : ActorMethod<[string], undefined>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'filterByBrand' : ActorMethod<[string], Array<Motorcycle>>,
  'filterByBrandAndCapacity' : ActorMethod<[string, bigint], Array<Motorcycle>>,
  'filterByCylinderCapacity' : ActorMethod<[bigint], Array<Motorcycle>>,
  'getAllMotorcycles' : ActorMethod<[], Array<Motorcycle>>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getMotorcycle' : ActorMethod<[string], [] | [Motorcycle]>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'updateMotorcycle' : ActorMethod<[string, Motorcycle], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
