// import { expect } from 'chai';
// import { describe, it } from 'mocha';
// import request from 'request';

// const API_URL = `http://${process.env.HOST}:${process.env.PORT}/`;
// const testUser = {
//   email: 'fileUser@file_manager.com',
//   password: '1234$!',
// };

//     request.post(
//       `${API_URL}/users`,
//       {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         json: {
//           email: testUser.email,
//           password: testUser.password,
//         },
//       },
//       (error, res, body) => {
//         expect(res.statusCode).to.equal(201);
//         expect(body).contains(JSON.stringify({ email: testUser.email }));
//         done();
//       },
//     );
//   }));
// });
