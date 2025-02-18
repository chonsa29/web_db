const express = require('express');
var cors = require('cors');
const oracledb = require('oracledb'); // Oracle DB 사용을 위한 패키지
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

// ejs 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.')); 

// Oracle DB 연결 설정
const dbConfig = {
  user: 'system',
  password: 'test1234',
  connectString: 'localhost:1521/orcl'  
};

async function connectToDB() {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    console.log('Oracle DB 연결 성공!');
    return connection;
  } catch (err) {
    console.error('DB 연결 실패:', err);
    return null;
  }
}

// 기본 경로
app.get('/', function (req, res) {
  res.send('Hello World');
});

// 로그인 API
app.post('/login', async (req, res) => {
  console.log(req.body);
  const { userId, pwd } = req.body;  // 클라이언트에서 보낸 데이터

  if (!userId || !pwd) {
    return res.status(400).send({ msg: '아이디와 비밀번호를 입력해주세요.' });
  }

  try {
    const connection = await connectToDB();
    if (connection) {
      const result = await connection.execute(
        `SELECT USERNAME, NICKNAME FROM MEMBER WHERE USERID = :userId AND PASSWORD = :pwd`,
        [userId, pwd], // :id, :pwd 바인딩 변수
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (result.rows.length > 0) {
        // 로그인 성공
        res.send({ msg: 'success', user: result.rows[0] });
      } else {
        // 로그인 실패
        res.send({ msg: 'fail' });
      }

      await connection.close();
    } else {
      res.status(500).send({ msg: 'DB 연결 실패' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: '로그인 중 오류가 발생했습니다.' });
  }
});

app.post('/list', async (req, res) => {
  const {} = req.body;  // 클라이언트에서 보낸 데이터
  try {
    const connection = await connectToDB();
    if (connection) { 
      const result = await connection.execute(
        `SELECT 
          BOARDNO, TITLE, USERNAME, B.USERID,
          CNT, TO_CHAR(B.CDATETIME, 'YYYY-MM-DD') AS CDATETIME 
         FROM BOARD B 
         INNER JOIN MEMBER M ON B.USERID = M.USERID`,
        [], 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      res.send({ msg: 'success', list : result.rows });
      await connection.close();
    } else {
      res.status(500).send({ msg: 'DB 연결 실패' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: '로그인 중 오류가 발생했습니다.' });
  }
});

app.post('/remove', async (req, res) => {
  console.log(req.body);
  const { boardNo } = req.body;  // 클라이언트에서 보낸 데이터
  try {
    const connection = await connectToDB();
    if (connection) {
      const result = await connection.execute(
        `DELETE FROM BOARD WHERE BOARDNO = :boardNo`,
        [boardNo], 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      await connection.commit();
      res.send({ msg: 'success'});
      await connection.close();
    } else {
      res.status(500).send({ msg: 'DB 연결 실패' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: '로그인 중 오류가 발생했습니다.' });
  }
});

app.post('/board/edit', async (req, res) => {
  console.log(req.body);
  const { TITLE, CONTENTS, BOARDNO } = req.body;  // 클라이언트에서 보낸 데이터
  try {
    const connection = await connectToDB();
    if (connection) {
      const result = await connection.execute(
        `UPDATE BOARD 
         SET 
            TITLE = :TITLE,
            CONTENTS = :CONTENTS,
            UDATETIME = SYSDATE
          WHERE BOARDNO = :BOARDNO`,
        [TITLE, CONTENTS, BOARDNO], 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      await connection.commit();
      res.send({ msg: 'success'});
      await connection.close();
    } else {
      res.status(500).send({ msg: 'DB 연결 실패' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: '로그인 중 오류가 발생했습니다.' });
  }
});

app.post('/view', async (req, res) => {
  const {boardNo} = req.body;  // 클라이언트에서 보낸 데이터
  try {
    const connection = await connectToDB();
    if (connection) {
      await connection.execute(
        `UPDATE BOARD 
         SET CNT = CNT+1 
         WHERE BOARDNO = :boardNo`,
        [boardNo], 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )
      await connection.commit();
      
      const result = await connection.execute(
        `SELECT 
          BOARDNO, TITLE, USERNAME, CONTENTS,
          CNT, TO_CHAR(B.CDATETIME, 'YYYY-MM-DD') AS CDATETIME 
         FROM BOARD B 
         INNER JOIN MEMBER M ON B.USERID = M.USERID 
         WHERE BOARDNO = :boardNo`,
        [boardNo], 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      res.send({ msg: 'success', info : result.rows[0] });
      await connection.close();
    } else {
      res.status(500).send({ msg: 'DB 연결 실패' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: '로그인 중 오류가 발생했습니다.' });
  }
});

app.post('/board/info', async (req, res) => {
  const {boardNo} = req.body;  // 클라이언트에서 보낸 데이터
  try {
    const connection = await connectToDB();
    if (connection) {  
      const result = await connection.execute(
        `SELECT 
          BOARDNO, TITLE, USERNAME, CONTENTS,
          CNT, TO_CHAR(B.CDATETIME, 'YYYY-MM-DD') AS CDATETIME 
         FROM BOARD B 
         INNER JOIN MEMBER M ON B.USERID = M.USERID 
         WHERE BOARDNO = :boardNo`,
        [boardNo], 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      res.send({ msg: 'success', info : result.rows[0] });
      await connection.close();
    } else {
      res.status(500).send({ msg: 'DB 연결 실패' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: '로그인 중 오류가 발생했습니다.' });
  }
});


app.post('/insert', async (req, res) => {
  console.log(req.body);
  const { title, contents, userId, kind } = req.body;  // 클라이언트에서 보낸 데이터
  try {
    const connection = await connectToDB();
    if (connection) {
      const result = await connection.execute(
        `INSERT INTO BOARD 
         VALUES(BOARD_SEQ.NEXTVAL, :title, :contents, :userId, 
         :kind, 0, 0, 1, 'N', SYSDATE, SYSDATE)`,
        [title, contents, userId, kind], 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      await connection.commit();
      res.send({ msg: 'success'});
      await connection.close();
    } else {
      res.status(500).send({ msg: 'DB 연결 실패' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: '작성 중 오류가 발생했습니다.' });
  }
});

app.post('/user/info', async (req, res) => {
  console.log(req.body);
  const { userId } = req.body;  // 클라이언트에서 보낸 데이터
  try {
    const connection = await connectToDB();
    if (connection) {
      const result = await connection.execute(
        `SELECT * FROM MEMBER WHERE USERID = :userId`,
        [userId], 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (result.rows.length > 0) {
        // 조회 성공
        res.send({ msg: 'success', user: result.rows[0] });
      } else {
        // 조회 실패
        res.send({ msg: 'fail' });
      }

      await connection.close();
    } else {
      res.status(500).send({ msg: 'DB 연결 실패' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: '로그인 중 오류가 발생했습니다.' });
  }
});



app.listen(3000, () => {
  console.log('서버가 3000 포트에서 실행 중입니다.');
});