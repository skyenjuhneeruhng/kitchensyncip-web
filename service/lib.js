var badwords = require('./bad-words');
var strs = ['A' , 'B' , 'C' , 'D' , 'E' , 'F' , 'G' , 'H' , 'I' , 'J' ,
'K' , 'L' , 'M' , 'N' , 'O' , 'P' , 'Q' , 'R' , 'S' , 'T' , 'U' , 'V' ,
'W' , 'X' , 'Y' , 'Z' , 'a' , 'b' , 'c' , 'd' , 'e' , 'f' , 'g' , 'h' ,
'i' , 'j' , 'k' , 'l' , 'm' , 'n' , 'o' , 'p' , 'q' , 'r' , 's' , 't' ,
'u' , 'v' , 'w' , 'x' , 'y' , 'z' , '1' , '2' , '3' , '4' , '5' , '6' , 
'7' , '8' , '9' , '0' , '~' , '!' , '@' , '#' , '$' , '%' , '^' , '&' , 
'*' , '(' , ')' , '+' , '-' , '_' , '=' , '{' , '}' , '[' , ']' , '.' ];
function randomStringGenerate(length)
{
	var output_1 = "";
	var output_2 = "";

	for(var i = 0 ; i < length ; i ++)
	{
		var rand1 = parseInt((Math.random() * 100)) % 82;
		var rand2 = 82 - rand1 - 1;
		output_1 += strs[rand1];
		output_2 = strs[rand2] + output_2;
	}
	var output = {
		output_1 : output_1,
		output_2 : output_2
	};
	return output;
}
exports.randomStringGenerate = randomStringGenerate;
exports.makeCustomerUUID = function()
{
	var randomStr = randomStringGenerate(5);
	return randomStr.output_1 + randomStr.output_2;
}
exports.verifyCustomerUUID = function(str)
{
	if(str == undefined)
		return false;
	if(str.length != 10)
		return false;

	var verified = true;
	for(var i = 0 ; i < 10 ; i ++)
	{
		var str1 = str.charAt(i);
		var str2 = str.charAt(19 - i);
		var str1Index = strs.indexOf(str1);
		var str2Index = strs.indexOf(str2);
		if((str1Index + str2Index) != 81)
		{
			verified = false;
			break;
		}
	}
	return verified;
}
exports.checkOffensive = function(str)
{
	var containOffensive = false;
	for(var i = 0 ; i < badwords.length ; i ++)
	{
		if(str.indexOf(badwords[i]) > -1)
		{
			containOffensive = true;
			break;
		}
	}
	return containOffensive;
}
