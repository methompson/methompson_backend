// import { MongoDBClient } from '@/src/utils/mongodb_client_class';

// describe('image_data.mongo.service', () => {
//   // Subject to change
//   const mongoDbClient = new MongoDBClient(
//     'mongodb://blog-root:blog-password@localhost',
//     'blog',
//   );

//   const filename0 = 'This is a file name';
//   const originalFilename0 = 'originalFileName';

//   const filename1 = 'This is a file name1';
//   const filename2 = 'This is a file name2';
//   const originalFilename1 = 'originalFileName1';
//   const originalFilename2 = 'originalFileName2';

//   const fileDetails = new ImageFileDetails(filename0, 'test', { x: 64, y: 32 });
//   const newImageDetails = new NewImageDetails(
//     [fileDetails],
//     'imageId',
//     originalFilename0,
//     new Date().toISOString(),
//     false,
//     '123',
//   );

//   let imageDBId = '';

//   test('clearing the database', async () => {
//     const collection = await mongoDbClient.db.then((db) =>
//       db.collection('images'),
//     );
//     await collection.deleteMany({});
//   });

//   describe('MongoImageDataService', () => {
//     let service: MongoImageDataService;

//     const errorSpy = jest.spyOn(console, 'error');

//     beforeEach(() => {
//       // errorSpy.mockImplementation(() => {});
//     });

//     afterEach(async () => {
//       await service.mongoDBClient.close();
//     });

//     test('images can be added', async () => {
//       service = new MongoImageDataService(mongoDbClient);

//       const results = await service.addImages([newImageDetails]);
//       expect(results.length).toBe(1);

//       const result = results[0];
//       expect(result.originalFilename).toBe(originalFilename0);
//       expect(result.files.length).toBe(1);

//       const file = result.files[0];
//       expect(file.filename).toBe(filename0);

//       imageDBId = result.id;
//     });

//     test('images can be retrieved using the filename', async () => {
//       service = new MongoImageDataService(mongoDbClient);

//       const result = await service.getImageByName(filename0);

//       // We use toMatchObject to make sure that the newImageDetails values are
//       // included within result. We know that result has an id value, but we
//       // aren't certain what that is and we aren't really even concerned
//       // what it may be.
//       expect(result.toJSON()).toMatchObject(newImageDetails.toJSON());
//     });

//     test('Deleting invalid data throws an error', async () => {
//       service = new MongoImageDataService(mongoDbClient);

//       await expect(() =>
//         service.deleteImage({ id: '123456789012345678901234' }),
//       ).rejects.toThrow();
//     });

//     test('images can be deleted and searching for the image results in an error', async () => {
//       service = new MongoImageDataService(mongoDbClient);

//       await service.deleteImage({ id: imageDBId });

//       expect(() => service.deleteImage({ id: imageDBId })).rejects.toThrow();
//     });

//     describe('rolling back writes', () => {
//       const fileDetails1 = new ImageFileDetails(filename1, 'test1', {
//         x: 64,
//         y: 32,
//       });
//       const fileDetails2 = new ImageFileDetails(filename2, 'test2', {
//         x: 64,
//         y: 32,
//       });

//       const newImageDetails1 = new NewImageDetails(
//         [fileDetails1],
//         'imageId',
//         originalFilename1,
//         new Date().toISOString(),
//         false,
//         '123',
//       );
//       const newImageDetails2 = new NewImageDetails(
//         [fileDetails2],
//         'imageId',
//         originalFilename2,
//         new Date().toISOString(),
//         false,
//         '123',
//       );
//       test('When the user attempts to add invalid data, an error is thrown', async () => {
//         errorSpy.mockImplementationOnce(() => {});

//         service = new MongoImageDataService(mongoDbClient);

//         // Adding a good image
//         await service.addImages([newImageDetails]);

//         const output1 = { ...newImageDetails1.toMongo(), _id: 1 };
//         const output2 = { ...newImageDetails2.toMongo(), _id: 1 };

//         const d1Spy = jest.spyOn(newImageDetails1, 'toMongo');
//         d1Spy.mockImplementation(() => output1);

//         const d2Spy = jest.spyOn(newImageDetails2, 'toMongo');
//         d2Spy.mockImplementation(() => output2);
//         await expect(() =>
//           service.addImages([newImageDetails1, newImageDetails2]),
//         ).rejects.toThrow();

//         expect(errorSpy).toHaveBeenCalledTimes(1);
//       });

//       test('Rolling back writes removes files that failed initially', async () => {
//         service = new MongoImageDataService(mongoDbClient);

//         await service.rollBackAdditions([newImageDetails1, newImageDetails2]);

//         await expect(service.getImageByName(filename0)).resolves.toEqual(
//           expect.anything(),
//         );

//         await expect(() => service.getImageByName(filename1)).rejects.toThrow(
//           'Result is null',
//         );
//         await expect(() => service.getImageByName(filename2)).rejects.toThrow(
//           'Result is null',
//         );

//         await service.deleteImage({ filename: filename0 });
//       });
//     });
//   });
// });
