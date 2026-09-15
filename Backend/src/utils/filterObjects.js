
const filterObj =(obj, ...allowedFields)=>{

    const newObject ={}

    Object.keys(obj).forEach((el)=>{
        if(allowedFields.includes(el))
            newObject[el] =obj[el] 
        
    })
    return newObject

}

export default filterObj