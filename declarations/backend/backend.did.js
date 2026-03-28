export const idlFactory = ({ IDL }) => {
  const Motorcycle = IDL.Record({
    'id' : IDL.Text,
    'model' : IDL.Text,
    'cylinderCapacity' : IDL.Nat,
    'description' : IDL.Text,
    'brand' : IDL.Text,
    'price' : IDL.Nat,
    'images' : IDL.Vec(IDL.Text),
  });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  return IDL.Service({
    'addMotorcycle' : IDL.Func([Motorcycle], [], []),
    'deleteMotorcycle' : IDL.Func([IDL.Text], [], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'filterByBrand' : IDL.Func([IDL.Text], [IDL.Vec(Motorcycle)], ['query']),
    'filterByBrandAndCapacity' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Vec(Motorcycle)],
        ['query'],
      ),
    'filterByCylinderCapacity' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(Motorcycle)],
        ['query'],
      ),
    'getAllMotorcycles' : IDL.Func([], [IDL.Vec(Motorcycle)], ['query']),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getMotorcycle' : IDL.Func([IDL.Text], [IDL.Opt(Motorcycle)], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'updateMotorcycle' : IDL.Func([IDL.Text, Motorcycle], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
