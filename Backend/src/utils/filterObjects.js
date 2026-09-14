
const filterObj =(obj, ...allowedFields)=>{

    const newObject ={}

    Object.keys(obj).forEach((el)=>{
        if(allowedFields.includes(el))// if allowedFild has a key in the obj
            newObject[el] =obj[el] // add the key to our new obj 
        
    })
    return newObject

}

export default filterObj