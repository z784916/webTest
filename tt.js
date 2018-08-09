 var gl;

    function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    }


    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    var shaderProgram;
	var testProgram;
    function initShaders() {
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    }


    var mvMatrix = mat4.create();
    var mvMatrixStack = [];
    var pMatrix = mat4.create();

    function mvPushMatrix() {
        var copy = mat4.create();
        mat4.set(mvMatrix, copy);
        mvMatrixStack.push(copy);
    }

    function mvPopMatrix() {
        if (mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        mvMatrix = mvMatrixStack.pop();
    }


    function setMatrixUniforms() {
        gl.uniformMatrix4fv(testProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(testProgram.mvMatrixUniform, false, mvMatrix);
    }


    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }


    var triangleVertexPositionBuffer;
    var triangleVertexColorBuffer;
    var squareVertexPositionBuffer;
    var squareVertexColorBuffer;

    function initBuffers(r,g,b) {
        triangleVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
        var vertices = [
             0.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        triangleVertexPositionBuffer.itemSize = 3;
        triangleVertexPositionBuffer.numItems = 3;

        triangleVertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
        var colors = [
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        triangleVertexColorBuffer.itemSize = 4;
        triangleVertexColorBuffer.numItems = 3;


        squareVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        vertices = [
             1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
             1.0, -1.0,  0.0,
            -1.0, -1.0,  0.0
            ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        squareVertexPositionBuffer.itemSize = 3;
        squareVertexPositionBuffer.numItems = 4;

        squareVertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
        colors = []
        for (var i=0; i < 4; i++) {
            colors = colors.concat([r, g, b	, 1.0]);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        squareVertexColorBuffer.itemSize = 4;
        squareVertexColorBuffer.numItems = 4;
		initBuffers_screen();
    }



    var rTri = 0;
    var rSquare = 0;
	var rBall = 0;	
    function drawScene() {
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
        drawSceneOnLaptopScreen();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);		
		
		gl.useProgram(testProgram);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);		
	
        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, [-4.5, 0.0, -7.0]);

        if (rFlag==1)
		{
			mvPushMatrix();
			mat4.rotate(mvMatrix, degToRad(rTri), [0, 1, 0]);

			gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
			gl.vertexAttribPointer(testProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
			gl.vertexAttribPointer(testProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

			setMatrixUniforms();
			gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
			mvPopMatrix();
		}

        mat4.translate(mvMatrix, [3.0, 0.0, 0.0]);

        if (sFlag==1)
		{
			mvPushMatrix();
			mat4.rotate(mvMatrix, degToRad(rSquare), [0, 1, 0]);

			gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
			gl.vertexAttribPointer(testProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
			gl.vertexAttribPointer(testProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

			setMatrixUniforms();
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);	
	
		gl.bindBuffer(gl.ARRAY_BUFFER, laptopScreenVertexPositionBuffer);
			
        gl.vertexAttribPointer(testProgram.vertexPositionAttribute, laptopScreenVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        // gl.bindBuffer(gl.ARRAY_BUFFER, laptopScreenVertexNormalBuffer);
        // gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, laptopScreenVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		if(rSquare%360>110 && rSquare%360<270)
		{
			 mat4.translate(mvMatrix, [0.0, 0.0, -0.2]);
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, graphicClearColor);
		gl.vertexAttribPointer(testProgram.vertexColorAttribute, graphicClearColor.itemSize, gl.FLOAT, false, 0, 0);
		
        gl.bindBuffer(gl.ARRAY_BUFFER, laptopScreenVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, laptopScreenVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, rttTexture);
        gl.uniform1i(testProgram.samplerUniform, 0);

        setMatrixUniforms();	
		if(mFlag==1)
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, laptopScreenVertexPositionBuffer.numItems);			
		mvPopMatrix();		
	}
		
    }

	
	var rttFramebuffer;
    var rttTexture;
	function initTextureFramebuffer() {
        rttFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
        rttFramebuffer.width = 512;
        rttFramebuffer.height = 512;

        rttTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, rttTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

	var moonVertexPositionBuffer;
    var moonVertexNormalBuffer;
    var moonVertexTextureCoordBuffer;
    var moonVertexIndexBuffer;
	var moonClearColorBuffer;
	var graphicClearColor;

    var laptopScreenVertexPositionBuffer;
    var laptopScreenVertexNormalBuffer;
    var laptopScreenVertexTextureCoordBuffer;	
	
function initBuffers_screen() {
        var latitudeBands = 30;
        var longitudeBands = 30;
        var radius = 1;

        var vertexPositionData = [];
        var normalData = [];
        var textureCoordData = [];
        for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                var u = 1 - (longNumber / longitudeBands);
                var v = 1 - (latNumber / latitudeBands);

                normalData.push(x);
                normalData.push(y);
                normalData.push(z);
                textureCoordData.push(u);
                textureCoordData.push(v);
                vertexPositionData.push(radius * x);
                vertexPositionData.push(radius * y);
                vertexPositionData.push(radius * z);
            }
        }

        var indexData = [];
        for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
            }
        }

        moonVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
        moonVertexNormalBuffer.itemSize = 3;
        moonVertexNormalBuffer.numItems = normalData.length / 3;

        moonVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
        moonVertexTextureCoordBuffer.itemSize = 2;
        moonVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

        moonVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
        moonVertexPositionBuffer.itemSize = 3;
        moonVertexPositionBuffer.numItems = vertexPositionData.length / 3;

        moonVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
        moonVertexIndexBuffer.itemSize = 1;
        moonVertexIndexBuffer.numItems = indexData.length;
		
		moonClearColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, moonClearColorBuffer);
        colors = []
        for (var i=0; i < vertexPositionData.length / 3; i++) {
            colors = colors.concat([0.0, 0, 0, 1.0]);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        moonClearColorBuffer.itemSize = 4;
        moonClearColorBuffer.numItems = vertexPositionData.length / 3;

        laptopScreenVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, laptopScreenVertexPositionBuffer);
        vertices = [
             1, -1, 0.05,
			-1, -1, 0.05,
             1, 1, 0.05,
            -1, 1, 0.05,
            ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        laptopScreenVertexPositionBuffer.itemSize = 3;
        laptopScreenVertexPositionBuffer.numItems = 4;

        laptopScreenVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, laptopScreenVertexNormalBuffer);
        var vertexNormals = [
             0.000000, -0.965926, 0.258819,
             0.000000, -0.965926, 0.258819,
             0.000000, -0.965926, 0.258819,
             0.000000, -0.965926, 0.258819,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
        laptopScreenVertexNormalBuffer.itemSize = 3;
        laptopScreenVertexNormalBuffer.numItems = 4;

        laptopScreenVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, laptopScreenVertexTextureCoordBuffer);
        var textureCoords = [
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        laptopScreenVertexTextureCoordBuffer.itemSize = 2;
        laptopScreenVertexTextureCoordBuffer.numItems = 4;
		
		graphicClearColor = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, graphicClearColor);
        colors = []
        for (var i=0; i < 4; i++) {
            colors = colors.concat([0.0, 0.0, 0.0, 1.0]);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        graphicClearColor.itemSize = 4;
        graphicClearColor.numItems = 4;
    }
	
	
	var laptopScreenAspectRatio = 1.66;

    var moonAngle = 180;
    var cubeAngle = 0;

    function drawSceneOnLaptopScreen() {
		 gl.useProgram(testProgram);
         //gl.viewport(0, 0, rttFramebuffer.width, rttFramebuffer.height);
         gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, laptopScreenAspectRatio, 0.1, 100.0, pMatrix);
        
        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, [-2, 0, -7]);
        //mat4.rotate(mvMatrix, degToRad(30), [1, 0, 0]);

        mvPushMatrix();        
		
        //mat4.translate(mvMatrix, [2, 0, 0]);
        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, moonTexture);
        // gl.uniform1i(shaderProgram.samplerUniform, 0);

        // gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
        // gl.vertexAttribPointer(testProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        // gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
        // gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, moonVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
		if(rSquare%180>= 0 && rSquare%180<=90)
		{
			mat4.rotate(mvMatrix, degToRad(180), [0, 0, 1]);
			if(rSquare%360>110 && rSquare%360<270)
			{
				mat4.rotate(mvMatrix, degToRad(180-rBall), [0, 1, 0]);
			}
			else
			{
				mat4.rotate(mvMatrix, degToRad(rBall), [0, 1, 0]);
			}			
			gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer); //鏡中地球
			gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, moonVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, moonClearColorBuffer);
			gl.vertexAttribPointer(testProgram.vertexColorAttribute, moonClearColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);		
			setMatrixUniforms();
			gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
		else if(rFlag==1)
		{
			mat4.translate(mvMatrix, [0, 0, 2]);
			mat4.rotate(mvMatrix, degToRad(180), [0, 0, 1]);
			if(rSquare%360>110 && rSquare%360<270)
			{
				mat4.rotate(mvMatrix, degToRad(180-rTri), [0, 1, 0]);
			}
			else
			{
				mat4.rotate(mvMatrix, degToRad(rTri), [0, 1, 0]);
			}	
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer); //鏡中三角
			gl.vertexAttribPointer(testProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
			gl.vertexAttribPointer(testProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
			setMatrixUniforms();
			gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
		}			
		
        mvPopMatrix();            

        gl.bindTexture(gl.TEXTURE_2D, rttTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    var lastTime = 0;
	var rTurn = 0;
	var sTurn = 0;
	var bTurn = 0;
	
	var rFlag = 1;
	var sFlag = 1;
	var bFlag = 1;
	var mFlag = 0;
	
    function animate() {
        var timeNow = new Date().getTime();
        if (lastTime != 0) {
            var elapsed = timeNow - lastTime;

            if(rTurn==1 && rFlag==1) rTri += (90 * elapsed) / 1000.0;
            if(sTurn==1) rSquare += (90 * elapsed) / 1000.0;
			if(bTurn==1) rBall += (90 * elapsed) / 1000.0;
        }
        lastTime = timeNow;
    }


    function tick() {		
        requestAnimFrame(tick);
        drawScene();
        animate();
    }

		function check(){
		if($("#myCheck").prop("checked") == true) rTurn=1;
		if($("#myCheck").prop("checked") == false) rTurn=0;
		if($("#SCheck").prop("checked") == true) sTurn=1;
		if($("#SCheck").prop("checked") == false) sTurn=0;
		if($("#BCheck").prop("checked") == true) bTurn=1;
		if($("#BCheck").prop("checked") == false) bTurn=0;
		if($("#mirrorCheck").prop("checked") == true) mFlag=1;
		if($("#mirrorCheck").prop("checked") == false) mFlag=0;
		tick();
		tick_ball();
	}
	
	function testFuc(val)
	{
		$("#test").text(val);
	}

	function Switch(switchId) {
		var tempFlag;
		if ($(switchId).find(":selected").index() == 1)
		{			
			gl.enable(gl.DEPTH_TEST);		
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
			tempFlag=0;			
			tick();	
			tick_ball();
		}
		else
		{
			tempFlag=1;
			tick();
			tick_ball();
		}
		if(switchId.id == 'Tswitch')
		{
			 rFlag=tempFlag;
		}
		if (switchId.id == 'Sswitch')
		{
			sFlag=tempFlag;
		}
		if (switchId.id == 'Bswitch')
		{
			bFlag=tempFlag;
		}
	}
	
    function webGLStart(r,g,b) {
        var canvas = document.getElementById("lesson03-canvas");
        initGL(canvas);   
		initTextureFramebuffer();		
		initShaders()
        initBuffers(r,g,b);
		testProgram = shaderProgram;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
		tick();
		initShaders_ball();
        initBuffers_ball();
        initTexture();
		tick_ball();
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
  		gl.enable(gl.DEPTH_TEST);	
    }
	
	var colorWell;

	window.addEventListener("load", startup, false);
		function startup() {
		colorWell = document.querySelector("#bgColor");
		colorWell.addEventListener("input", updateFirst, false);
	}
	
	function updateFirst(event) {
		var p = document.querySelector("#test");		
		if (p) 
		{
			p.style.color = event.target.value;
		}
		webGLStart(hexToRgb(colorWell.value)[0]/256,hexToRgb(colorWell.value)[1]/256,hexToRgb(colorWell.value)[2]/256);
		p.innerHTML = hexToRgb(colorWell.value)[0]+","+hexToRgb(colorWell.value)[1]+","+hexToRgb(colorWell.value)[2];
	}
	
	var hexToRgb = function(hex) {
		var rgb = [];

		hex = hex.substr(1);//去除前缀 # 号

		 if (hex.length == 3) { // 处理 "#abc" 成 "#aabbcc"
			hex = hex.replace(/(.)/g, '$1$1');
		} 

		hex.replace(/../g, function(color){
			rgb.push(parseInt(color, 0x10));//按16进制将字符串转换为数字
		});
		return rgb;
	
	};